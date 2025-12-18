#!/bin/bash
set -e

# ============================================
# Omnex Core Platform - Server Setup Script
# Target: DigitalOcean Droplet (Ubuntu 22.04)
# IP: 104.248.80.247
# Domain: property.onway-gmbh.de
# ============================================

echo "=========================================="
echo "  Omnex Server Setup - Starting"
echo "  $(date)"
echo "=========================================="

# Variables
DB_USER="omnex_user"
DB_PASSWORD="JHkS2q4N9HbLqKO5KnqPQ"
CORE_DB="omnex_core"
TENANT_DB="tenant_omnexcore_2025"
DOMAIN="property.onway-gmbh.de"
APP_DIR="/var/www/omnex"
REPO_URL="https://github.com/aka-uba/omnex-core-platform.git"

# 1. System Update
echo "[1/10] Updating system..."
apt update && apt upgrade -y

# 2. Install basic dependencies
echo "[2/10] Installing basic dependencies..."
apt install -y git curl build-essential software-properties-common

# 3. Install Node.js 20.x
echo "[3/10] Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# 4. Install PostgreSQL
echo "[4/10] Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 5. Create Database and User
echo "[5/10] Creating databases and user..."
sudo -u postgres psql <<EOF
-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create databases
CREATE DATABASE ${CORE_DB} OWNER ${DB_USER};
CREATE DATABASE ${TENANT_DB} OWNER ${DB_USER};

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${CORE_DB} TO ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${TENANT_DB} TO ${DB_USER};

-- Grant schema privileges
\c ${CORE_DB}
GRANT ALL ON SCHEMA public TO ${DB_USER};
\c ${TENANT_DB}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

echo "Databases created: ${CORE_DB}, ${TENANT_DB}"

# 6. Install PM2
echo "[6/10] Installing PM2..."
npm install -g pm2

# Create PM2 log directory
mkdir -p /var/log/pm2

# 7. Install Nginx
echo "[7/10] Installing Nginx..."
apt install -y nginx

# 8. Clone Repository
echo "[8/10] Cloning repository..."
mkdir -p /var/www
cd /var/www

if [ -d "omnex" ]; then
    echo "Directory exists, pulling latest..."
    cd omnex
    git fetch origin
    git checkout main
    git pull origin main
else
    git clone ${REPO_URL} omnex
    cd omnex
fi

# 9. Setup Environment
echo "[9/10] Setting up environment..."
cp .env.production .env

# 10. Install dependencies and build
echo "[10/10] Installing dependencies and building..."
npm ci --production=false

# Schema merge
npm run schema:merge || true
npm run schema:validate || true

# Prisma generate
npx prisma generate --schema=prisma/core.schema.prisma
npx prisma generate --schema=prisma/tenant.schema.prisma

# Database push
npx prisma db push --schema=prisma/core.schema.prisma --accept-data-loss
npx prisma db push --schema=prisma/tenant.schema.prisma --accept-data-loss

# Build
npm run build

# Make deploy script executable
chmod +x deploy.sh

# Setup PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

# Setup Nginx
echo "[NGINX] Configuring..."
cp nginx.conf /etc/nginx/sites-available/omnex
ln -sf /etc/nginx/sites-available/omnex /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Setup Firewall
echo "[FIREWALL] Configuring UFW..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=========================================="
echo "  Omnex Server Setup - Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Point DNS: ${DOMAIN} -> 104.248.80.247"
echo "2. After DNS propagation, run:"
echo "   certbot --nginx -d ${DOMAIN}"
echo ""
echo "3. Setup GitHub Actions secrets:"
echo "   - SERVER_HOST: 104.248.80.247"
echo "   - SSH_PRIVATE_KEY: (your SSH key)"
echo ""
echo "App URL: http://104.248.80.247 (IP)"
echo "App URL: http://${DOMAIN} (after DNS)"
echo "=========================================="
