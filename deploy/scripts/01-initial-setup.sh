#!/bin/bash
# ============================================
# Omnex Core Platform - Initial Server Setup
# Ubuntu 24.04 LTS - Docker-based deployment
# ============================================
# Run as root: bash 01-initial-setup.sh

set -e

echo "============================================"
echo "Omnex Core Platform - Initial Setup"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root"
    exit 1
fi

# ============================================
# 1. System Update
# ============================================
echo ""
echo "1. Updating system packages..."
apt update && apt upgrade -y
print_status "System updated"

# ============================================
# 2. Install Essential Packages
# ============================================
echo ""
echo "2. Installing essential packages..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    ufw \
    fail2ban \
    unzip \
    htop \
    vim \
    git \
    rsync
print_status "Essential packages installed"

# ============================================
# 3. Install Docker
# ============================================
echo ""
echo "3. Installing Docker..."

# Remove old versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

print_status "Docker installed: $(docker --version)"
print_status "Docker Compose: $(docker compose version)"

# ============================================
# 4. Create Deploy User
# ============================================
echo ""
echo "4. Creating deploy user..."

if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    print_status "User 'deploy' created and added to docker group"
else
    usermod -aG docker deploy
    print_status "User 'deploy' already exists, added to docker group"
fi

# Create app directory
mkdir -p /opt/omnex
chown -R deploy:deploy /opt/omnex
print_status "App directory created: /opt/omnex"

# ============================================
# 5. Configure SSH Security
# ============================================
echo ""
echo "5. Configuring SSH security..."

# Backup original config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Create secure SSH config
cat > /etc/ssh/sshd_config.d/99-security.conf << 'EOF'
# SSH Security Hardening
Port 2222
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
MaxSessions 5
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no
AllowTcpForwarding no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
Protocol 2
EOF

# Test SSH config
if sshd -t; then
    print_status "SSH config valid"
else
    print_error "SSH config invalid, reverting..."
    rm /etc/ssh/sshd_config.d/99-security.conf
    exit 1
fi

print_warning "SSH will use port 2222 after restart"

# ============================================
# 6. Configure Firewall (UFW)
# ============================================
echo ""
echo "6. Configuring firewall..."

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (both ports during transition)
ufw allow 22/tcp comment 'SSH Standard'
ufw allow 2222/tcp comment 'SSH Hardened'

# Allow web traffic
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Allow FTP (passive)
ufw allow 21/tcp comment 'FTP'
ufw allow 40000:40100/tcp comment 'FTP Passive'

# Enable UFW
ufw --force enable
print_status "Firewall configured and enabled"
ufw status verbose

# ============================================
# 7. Configure Fail2Ban
# ============================================
echo ""
echo "7. Configuring Fail2Ban..."

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
banaction = ufw
backend = systemd

[sshd]
enabled = true
port = ssh,2222
filter = sshd
maxretry = 3
bantime = 24h

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 1h

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 24h

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 1h
EOF

systemctl restart fail2ban
systemctl enable fail2ban
print_status "Fail2Ban configured"
fail2ban-client status

# ============================================
# 8. Kernel Security Settings
# ============================================
echo ""
echo "8. Applying kernel security settings..."

cat >> /etc/sysctl.conf << 'EOF'

# Security hardening
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
kernel.randomize_va_space = 2
EOF

sysctl -p
print_status "Kernel security settings applied"

# ============================================
# 9. Setup Log Rotation for Docker
# ============================================
echo ""
echo "9. Configuring Docker log rotation..."

cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "live-restore": true
}
EOF

systemctl restart docker
print_status "Docker log rotation configured"

# ============================================
# 10. Create Swap (if needed)
# ============================================
echo ""
echo "10. Checking swap..."

if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    print_status "2GB Swap created"
else
    print_status "Swap already exists"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "============================================"
echo -e "${GREEN}Initial Setup Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Copy your SSH public key to /home/deploy/.ssh/authorized_keys"
echo "2. Test SSH connection on port 2222"
echo "3. Run 02-deploy-app.sh to deploy the application"
echo ""
echo "IMPORTANT: After testing SSH on port 2222, close port 22:"
echo "  ufw delete allow 22/tcp"
echo ""
print_warning "Do NOT close this session until you've verified SSH on port 2222!"
