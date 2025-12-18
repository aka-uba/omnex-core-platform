/**
 * Production Deploy API Endpoint
 *
 * SSH bağlantısı, sunucu yapılandırması ve deployment işlemleri
 * Hetzner CPX31 (4 vCPU, 8GB RAM, 160GB NVMe) hedefli
 */

import { NextRequest, NextResponse } from 'next/server';

// SSH ve remote execution için types
interface ServerConfig {
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  password?: string;
}

interface DeployConfig {
  appName: string;
  domain: string;
  repoUrl: string;
  branch: string;
  nodeVersion: string;
  pm2Instances: number;
  enableSsl: boolean;
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  databaseUser: string;
  databasePassword: string;
}

interface DeployStep {
  id: string;
  name: string;
  description: string;
  command: string;
  required: boolean;
}

// Standard deploy steps for Hetzner CPX31
const DEPLOY_STEPS: DeployStep[] = [
  {
    id: 'check-connection',
    name: 'SSH Bağlantı Testi',
    description: 'Sunucuya SSH bağlantısı kontrol edilir',
    command: 'echo "SSH connection successful"',
    required: true,
  },
  {
    id: 'update-system',
    name: 'Sistem Güncellemesi',
    description: 'apt update && apt upgrade',
    command: 'sudo apt update && sudo apt upgrade -y',
    required: true,
  },
  {
    id: 'install-deps',
    name: 'Bağımlılık Kurulumu',
    description: 'Node.js, PM2, Nginx, Certbot kurulumu',
    command: `
      # Node.js 20.x LTS
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt install -y nodejs

      # PM2
      sudo npm install -g pm2

      # Nginx
      sudo apt install -y nginx

      # Certbot for SSL
      sudo apt install -y certbot python3-certbot-nginx
    `,
    required: true,
  },
  {
    id: 'setup-postgresql',
    name: 'PostgreSQL Kurulumu',
    description: 'PostgreSQL 16 ve PgBouncer kurulumu',
    command: `
      # PostgreSQL 16
      sudo apt install -y postgresql postgresql-contrib

      # Start and enable
      sudo systemctl start postgresql
      sudo systemctl enable postgresql
    `,
    required: true,
  },
  {
    id: 'create-database',
    name: 'Veritabanı Oluştur',
    description: 'Core ve Tenant veritabanları oluşturulur',
    command: `
      sudo -u postgres psql -c "CREATE USER {{DB_USER}} WITH PASSWORD '{{DB_PASSWORD}}';"
      sudo -u postgres psql -c "CREATE DATABASE {{CORE_DB_NAME}} OWNER {{DB_USER}};"
      sudo -u postgres psql -c "CREATE DATABASE {{TENANT_DB_NAME}} OWNER {{DB_USER}};"
      sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE {{CORE_DB_NAME}} TO {{DB_USER}};"
      sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE {{TENANT_DB_NAME}} TO {{DB_USER}};"
    `,
    required: true,
  },
  {
    id: 'clone-repo',
    name: 'Repo Klonla',
    description: 'GitHub repository klonlanır',
    command: `
      mkdir -p /var/www
      cd /var/www
      git clone {{REPO_URL}} {{APP_NAME}}
      cd {{APP_NAME}}
      git checkout {{BRANCH}}
    `,
    required: true,
  },
  {
    id: 'install-app',
    name: 'Uygulama Kurulumu',
    description: 'npm install ve build',
    command: `
      cd /var/www/{{APP_NAME}}
      npm ci --production=false
      npm run build
    `,
    required: true,
  },
  {
    id: 'setup-env',
    name: 'Environment Ayarları',
    description: '.env dosyası oluşturulur',
    command: `
      cat > /var/www/{{APP_NAME}}/.env << 'EOF'
{{ENV_CONTENT}}
EOF
    `,
    required: true,
  },
  {
    id: 'prisma-migrate',
    name: 'Prisma Migrate',
    description: 'Veritabanı şeması uygulanır',
    command: `
      cd /var/www/{{APP_NAME}}
      npx prisma generate --schema=prisma/core.schema.prisma
      npx prisma generate --schema=prisma/tenant.schema.prisma
      npx prisma db push --schema=prisma/core.schema.prisma
      npx prisma db push --schema=prisma/tenant.schema.prisma
    `,
    required: true,
  },
  {
    id: 'setup-pm2',
    name: 'PM2 Yapılandırması',
    description: 'PM2 ecosystem config ve başlatma',
    command: `
      cat > /var/www/{{APP_NAME}}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: '{{APP_NAME}}',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/{{APP_NAME}}',
    instances: {{PM2_INSTANCES}},
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/{{APP_NAME}}-error.log',
    out_file: '/var/log/pm2/{{APP_NAME}}-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

      sudo mkdir -p /var/log/pm2
      cd /var/www/{{APP_NAME}}
      pm2 start ecosystem.config.js
      pm2 save
      pm2 startup systemd -u $USER --hp $HOME
    `,
    required: true,
  },
  {
    id: 'setup-nginx',
    name: 'Nginx Yapılandırması',
    description: 'Reverse proxy ayarları',
    command: `
      cat > /etc/nginx/sites-available/{{APP_NAME}} << 'EOF'
server {
    listen 80;
    server_name {{DOMAIN}};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /_next/static {
        alias /var/www/{{APP_NAME}}/.next/static;
        expires 365d;
        access_log off;
    }

    location /public {
        alias /var/www/{{APP_NAME}}/public;
        expires 30d;
        access_log off;
    }
}
EOF

      sudo ln -sf /etc/nginx/sites-available/{{APP_NAME}} /etc/nginx/sites-enabled/
      sudo rm -f /etc/nginx/sites-enabled/default
      sudo nginx -t
      sudo systemctl reload nginx
    `,
    required: true,
  },
  {
    id: 'setup-ssl',
    name: 'SSL Sertifikası',
    description: 'Let\'s Encrypt SSL kurulumu',
    command: `
      sudo certbot --nginx -d {{DOMAIN}} --non-interactive --agree-tos -m admin@{{DOMAIN}}
    `,
    required: false,
  },
  {
    id: 'setup-firewall',
    name: 'Firewall Yapılandırması',
    description: 'UFW firewall kuralları',
    command: `
      sudo ufw allow 22/tcp
      sudo ufw allow 80/tcp
      sudo ufw allow 443/tcp
      sudo ufw --force enable
    `,
    required: true,
  },
];

// GET: Deploy adımlarını ve durumlarını getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'steps') {
      // Return deploy steps
      return NextResponse.json({
        success: true,
        data: {
          steps: DEPLOY_STEPS.map((step) => ({
            id: step.id,
            name: step.name,
            description: step.description,
            required: step.required,
          })),
        },
      });
    }

    if (action === 'generate-scripts') {
      const appName = searchParams.get('appName') || 'omnex-app';
      const domain = searchParams.get('domain') || 'example.com';
      const branch = searchParams.get('branch') || 'main';

      // Generate deploy.sh script
      const deployScript = generateDeployScript(appName, domain, branch);

      // Generate ecosystem.config.js
      const ecosystemConfig = generateEcosystemConfig(appName);

      // Generate nginx config
      const nginxConfig = generateNginxConfig(appName, domain);

      // Generate GitHub Actions workflow
      const githubWorkflow = generateGitHubWorkflow(appName, domain);

      return NextResponse.json({
        success: true,
        data: {
          deployScript,
          ecosystemConfig,
          nginxConfig,
          githubWorkflow,
        },
      });
    }

    // Default: return server requirements
    return NextResponse.json({
      success: true,
      data: {
        requirements: {
          server: 'Hetzner CPX31 (recommended)',
          specs: {
            cpu: '4 vCPU (AMD)',
            ram: '8 GB RAM',
            storage: '160 GB NVMe SSD',
            bandwidth: '20 TB Traffic',
          },
          software: {
            os: 'Ubuntu 22.04 LTS',
            node: 'Node.js 20.x LTS',
            database: 'PostgreSQL 16',
            processManager: 'PM2',
            webServer: 'Nginx',
            ssl: 'Certbot (Let\'s Encrypt)',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error in deploy GET:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get deploy info',
      },
      { status: 500 }
    );
  }
}

// POST: Deploy işlemlerini çalıştır
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverConfig, deployConfig, stepId } = body;

    if (action === 'test-connection') {
      // Test SSH connection (simulated for now, real implementation would use ssh2)
      const { host, port, username } = serverConfig as ServerConfig;

      if (!host || !username) {
        return NextResponse.json(
          { success: false, error: 'Host and username are required' },
          { status: 400 }
        );
      }

      // In a real implementation, this would use the ssh2 library
      // For now, return success with a note about implementation
      return NextResponse.json({
        success: true,
        data: {
          message: 'SSH connection test initiated',
          note: 'Actual SSH connection requires server-side implementation with ssh2 library',
          config: {
            host,
            port: port || 22,
            username,
          },
        },
      });
    }

    if (action === 'execute-step') {
      // Execute a specific deploy step
      const step = DEPLOY_STEPS.find((s) => s.id === stepId);

      if (!step) {
        return NextResponse.json(
          { success: false, error: `Step not found: ${stepId}` },
          { status: 404 }
        );
      }

      // Replace placeholders in command
      let command = step.command;
      if (deployConfig) {
        const config = deployConfig as DeployConfig;
        command = command
          .replace(/\{\{APP_NAME\}\}/g, config.appName)
          .replace(/\{\{DOMAIN\}\}/g, config.domain)
          .replace(/\{\{REPO_URL\}\}/g, config.repoUrl)
          .replace(/\{\{BRANCH\}\}/g, config.branch)
          .replace(/\{\{PM2_INSTANCES\}\}/g, String(config.pm2Instances))
          .replace(/\{\{DB_USER\}\}/g, config.databaseUser)
          .replace(/\{\{DB_PASSWORD\}\}/g, config.databasePassword)
          .replace(/\{\{CORE_DB_NAME\}\}/g, 'omnex_core')
          .replace(/\{\{TENANT_DB_NAME\}\}/g, config.databaseName);
      }

      return NextResponse.json({
        success: true,
        data: {
          stepId: step.id,
          stepName: step.name,
          command,
          note: 'Command prepared for execution. Actual execution requires SSH connection.',
        },
      });
    }

    if (action === 'save-config') {
      // Save deploy configuration (would typically save to database or file)
      return NextResponse.json({
        success: true,
        data: {
          message: 'Configuration saved',
          serverConfig,
          deployConfig,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in deploy POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute deploy action',
      },
      { status: 500 }
    );
  }
}

// Helper: Generate deploy.sh script
function generateDeployScript(appName: string, domain: string, branch: string): string {
  return `#!/bin/bash
set -e

# Omnex Production Deploy Script
# Target: Hetzner CPX31 (4 vCPU, 8GB RAM, 160GB NVMe)

APP_NAME="${appName}"
APP_DIR="/var/www/\${APP_NAME}"
DOMAIN="${domain}"
BRANCH="${branch}"

echo "=========================================="
echo "  Omnex Production Deploy"
echo "  App: \${APP_NAME}"
echo "  Domain: \${DOMAIN}"
echo "  Branch: \${BRANCH}"
echo "=========================================="

# Navigate to app directory
cd \${APP_DIR}

# Pull latest changes
echo "[1/6] Pulling latest changes..."
git fetch origin
git checkout \${BRANCH}
git pull origin \${BRANCH}

# Install dependencies
echo "[2/6] Installing dependencies..."
npm ci --production=false

# Run build
echo "[3/6] Building application..."
npm run build

# Run Prisma migrations
echo "[4/6] Running Prisma migrations..."
npm run prisma:merge
npx prisma generate --schema=prisma/core.schema.prisma
npx prisma generate --schema=prisma/tenant.schema.prisma
npx prisma db push --schema=prisma/core.schema.prisma --accept-data-loss
npx prisma db push --schema=prisma/tenant.schema.prisma --accept-data-loss

# Restart PM2
echo "[5/6] Restarting PM2..."
pm2 reload ecosystem.config.js --update-env

# Clear cache
echo "[6/6] Clearing cache..."
pm2 flush

echo "=========================================="
echo "  Deploy completed successfully!"
echo "  App running at: https://\${DOMAIN}"
echo "=========================================="
`;
}

// Helper: Generate ecosystem.config.js
function generateEcosystemConfig(appName: string): string {
  return `module.exports = {
  apps: [{
    name: '${appName}',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/${appName}',
    instances: 'max', // Use all available CPUs (4 on CPX31)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Memory management
    max_memory_restart: '1500M',

    // Logging
    error_file: '/var/log/pm2/${appName}-error.log',
    out_file: '/var/log/pm2/${appName}-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Graceful restart
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Auto restart on failure
    autorestart: true,
    max_restarts: 10,
    restart_delay: 4000,

    // Watch (disabled in production)
    watch: false,
    ignore_watch: ['node_modules', '.next', 'logs']
  }]
};
`;
}

// Helper: Generate Nginx config
function generateNginxConfig(appName: string, domain: string): string {
  return `# Nginx configuration for ${appName}
# Target: ${domain}

upstream ${appName}_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=${appName}_limit:10m rate=10r/s;

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req zone=${appName}_limit burst=20 nodelay;

    # Static files - Next.js
    location /_next/static {
        alias /var/www/${appName}/.next/static;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Public files
    location /public {
        alias /var/www/${appName}/public;
        expires 30d;
        access_log off;
    }

    # Favicon
    location /favicon.ico {
        alias /var/www/${appName}/public/favicon.ico;
        expires 30d;
        access_log off;
    }

    # API routes
    location /api {
        proxy_pass http://${appName}_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # API timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Main application
    location / {
        proxy_pass http://${appName}_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
`;
}

// Helper: Generate GitHub Actions workflow
function generateGitHubWorkflow(appName: string, domain: string): string {
  return `name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  APP_NAME: ${appName}
  DOMAIN: ${domain}

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test --if-present

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.SERVER_HOST }}
          username: \${{ secrets.SERVER_USER }}
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: \${{ secrets.SERVER_PORT || 22 }}
          script: |
            cd /var/www/\${{ env.APP_NAME }}

            # Pull latest changes
            git fetch origin
            git checkout main
            git pull origin main

            # Install dependencies
            npm ci --production=false

            # Build
            npm run build

            # Prisma
            npm run prisma:merge
            npx prisma generate --schema=prisma/core.schema.prisma
            npx prisma generate --schema=prisma/tenant.schema.prisma
            npx prisma db push --schema=prisma/core.schema.prisma --accept-data-loss
            npx prisma db push --schema=prisma/tenant.schema.prisma --accept-data-loss

            # Restart PM2
            pm2 reload ecosystem.config.js --update-env

            echo "Deploy completed at $(date)"

      - name: Health check
        run: |
          sleep 30
          curl -f https://\${{ env.DOMAIN }}/api/health || exit 1

      - name: Notify on failure
        if: failure()
        run: |
          echo "Deployment failed! Check the logs for details."
`;
}
