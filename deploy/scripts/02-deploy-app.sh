#!/bin/bash
# ============================================
# Omnex Core Platform - Application Deployment
# ============================================
# Run as deploy user: sudo -u deploy bash 02-deploy-app.sh

set -e

echo "============================================"
echo "Omnex Core Platform - Deployment"
echo "============================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

APP_DIR="/opt/omnex"
DEPLOY_DIR="$APP_DIR/deploy"

# ============================================
# 1. Check Prerequisites
# ============================================
echo ""
echo "1. Checking prerequisites..."

if [ ! -f "$DEPLOY_DIR/.env" ]; then
    print_error ".env file not found!"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp $DEPLOY_DIR/.env.example $DEPLOY_DIR/.env"
    echo "  nano $DEPLOY_DIR/.env"
    exit 1
fi

print_status "Prerequisites check passed"

# ============================================
# 2. Stop existing containers
# ============================================
echo ""
echo "2. Stopping existing containers..."

cd "$DEPLOY_DIR"
docker compose down 2>/dev/null || true
print_status "Existing containers stopped"

# ============================================
# 3. Setup SSL Certificates
# ============================================
echo ""
echo "3. Setting up SSL certificates..."

source "$DEPLOY_DIR/.env"

# Create certbot directories
mkdir -p "$DEPLOY_DIR/certbot/conf" "$DEPLOY_DIR/certbot/www"

if [ ! -d "$DEPLOY_DIR/certbot/conf/live/$DOMAIN" ]; then
    print_warning "SSL certificates not found, obtaining new ones..."

    # Create temporary nginx config for ACME challenge
    mkdir -p "$DEPLOY_DIR/nginx/conf.d"
    cat > "$DEPLOY_DIR/nginx/conf.d/default.conf" << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
    }
}
EOF

    # Start nginx temporarily
    docker compose up -d nginx
    sleep 5

    # Get certificate
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    # Stop nginx
    docker compose down

    print_status "SSL certificates obtained"
else
    print_status "SSL certificates exist"
fi

# ============================================
# 4. Restore nginx config
# ============================================
echo ""
echo "4. Setting up nginx configuration..."

# Copy the full nginx config
cp "$APP_DIR/deploy/nginx/conf.d/default.conf.template" "$DEPLOY_DIR/nginx/conf.d/default.conf" 2>/dev/null || true
print_status "Nginx configuration ready"

# ============================================
# 5. Build and Start Application
# ============================================
echo ""
echo "5. Building and starting application..."

cd "$DEPLOY_DIR"

# Pull latest images
docker compose pull

# Build the app
docker compose build --no-cache app

# Start all services
docker compose up -d

print_status "Application started"

# ============================================
# 6. Wait for services to be ready
# ============================================
echo ""
echo "6. Waiting for services to be ready..."

sleep 10

# Check container status
docker compose ps

# Check health
for i in {1..30}; do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Application is healthy!"
        break
    fi
    echo "Waiting for application... ($i/30)"
    sleep 2
done

# ============================================
# 7. Show status
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "============================================"
echo ""
echo "Container Status:"
docker compose ps
echo ""
echo "Logs (last 20 lines):"
docker compose logs --tail=20
echo ""
echo "Application URL: https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose logs -f"
echo "  Restart:       docker compose restart"
echo "  Stop:          docker compose down"
echo "  Shell:         docker compose exec app sh"
echo "  DB Shell:      docker compose exec postgres psql -U \$PG_USER -d omnex_core"
