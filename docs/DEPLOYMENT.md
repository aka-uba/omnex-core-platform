# Deployment Guide - Omnex SaaS Platform

## Production Deployment

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Domain with SSL certificate
- Minimum 2GB RAM, 2 CPU cores

### Environment Setup

1. **Create Production Environment File**

```bash
cp .env.example .env.production
```

2. **Configure Critical Variables**

```env
# Production Database
CORE_DATABASE_URL="postgresql://user:pass@prod-db:5432/omnex_core"

# Security (MUST be unique and strong)
JWT_SECRET="[64-char-random-string]"
JWT_REFRESH_SECRET="[64-char-random-string]"
SESSION_SECRET="[64-char-random-string]"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Database Setup

```bash
# 1. Create core database
npm run db:create

# 2. Run core migrations
npx prisma migrate deploy --schema=prisma/core.schema.prisma

# 3. Seed core data
npm run db:seed:core

# 4. Create first tenant
npm run tenant:create -- --name="Production" --slug="prod"
```

### Build and Deploy

```bash
# Install dependencies
npm ci --production=false

# Build application
npm run build

# Start production server
npm start
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "omnex-core" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on boot
pm2 startup
```

### Monitoring

```bash
# View logs
pm2 logs omnex-core

# Monitor resources
pm2 monit

# Health check
curl https://your-domain.com/api/health
```

## Backup Strategy

### Automated Backups

```bash
# Daily backup cron job
0 2 * * * /path/to/backup-script.sh

# Backup script example
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -h localhost -U postgres omnex_core > backup_core_$DATE.sql
npm run tenant:export -- --tenant=prod --output=/backups
```

### Disaster Recovery

1. Restore core database
2. Restore tenant databases
3. Restore file storage
4. Verify data integrity

## Security Checklist

- [ ] Strong JWT secrets configured
- [ ] HTTPS enabled
- [ ] Rate limiting active
- [ ] Database backups automated
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Audit logging enabled
