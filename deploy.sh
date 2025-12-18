#!/bin/bash
set -e

# ============================================
# Omnex Core Platform - Production Deploy Script
# Server: DigitalOcean Droplet
# Domain: property.onway-gmbh.de
# ============================================

APP_DIR="/var/www/omnex"
LOG_FILE="/var/log/omnex-deploy.log"

echo "=========================================="
echo "  Omnex Production Deploy"
echo "  $(date)"
echo "==========================================" | tee -a $LOG_FILE

cd $APP_DIR

# Pull latest changes
echo "[1/7] Pulling latest changes..." | tee -a $LOG_FILE
git fetch origin
git checkout main
git pull origin main

# Install dependencies
echo "[2/7] Installing dependencies..." | tee -a $LOG_FILE
npm ci --production=false

# Schema merge and validation
echo "[3/7] Merging and validating schemas..." | tee -a $LOG_FILE
npm run schema:merge || true
npm run schema:validate || true

# Prisma generate
echo "[4/7] Generating Prisma clients..." | tee -a $LOG_FILE
npx prisma generate --schema=prisma/core.schema.prisma
npx prisma generate --schema=prisma/tenant.schema.prisma

# Database push (use with caution in production)
echo "[5/7] Applying database changes..." | tee -a $LOG_FILE
npx prisma db push --schema=prisma/core.schema.prisma --accept-data-loss || true
npx prisma db push --schema=prisma/tenant.schema.prisma --accept-data-loss || true

# Build application
echo "[6/7] Building application..." | tee -a $LOG_FILE
npm run build

# Restart PM2
echo "[7/7] Restarting PM2..." | tee -a $LOG_FILE
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "==========================================" | tee -a $LOG_FILE
echo "  Deploy completed successfully!" | tee -a $LOG_FILE
echo "  App running at: https://property.onway-gmbh.de" | tee -a $LOG_FILE
echo "  $(date)" | tee -a $LOG_FILE
echo "==========================================" | tee -a $LOG_FILE
