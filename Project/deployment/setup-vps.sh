#!/bin/bash
# VPS Setup Script for Growloc Cloud Infrastructure
# Installs PostgreSQL, TimescaleDB, Mosquitto MQTT, Nginx, and Node.js
# Compatible with Ubuntu 22.04 LTS

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🌱 Growloc VPS Setup Script${NC}"
echo "This script will install and configure:"
echo "- PostgreSQL 15 + TimescaleDB"
echo "- Mosquitto MQTT Broker"
echo "- Nginx"
echo "- Node.js 18"
echo "- PM2 Process Manager"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing PostgreSQL 15...${NC}"
apt install -y postgresql-15 postgresql-contrib-15

echo -e "${YELLOW}Step 3: Installing TimescaleDB...${NC}"
sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main' > /etc/apt/sources.list.d/timescaledb.list"
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | apt-key add -
apt update
apt install -y timescaledb-2-postgresql-15
timescaledb-tune --quiet --yes

echo -e "${YELLOW}Step 4: Configuring PostgreSQL...${NC}"
sudo -u postgres psql << EOF
CREATE DATABASE growloc_db;
CREATE USER growloc_user WITH ENCRYPTED PASSWORD 'change_this_password';
GRANT ALL PRIVILEGES ON DATABASE growloc_db TO growloc_user;
\c growloc_db
CREATE EXTENSION IF NOT EXISTS timescaledb;
ALTER DATABASE growloc_db OWNER TO growloc_user;
EOF

systemctl restart postgresql
echo -e "${GREEN}✅ PostgreSQL + TimescaleDB installed${NC}"

echo -e "${YELLOW}Step 5: Installing Mosquitto MQTT Broker...${NC}"
apt install -y mosquitto mosquitto-clients

# Create Mosquitto config
cat > /etc/mosquitto/conf.d/growloc.conf << 'EOF'
listener 1883
protocol mqtt
allow_anonymous true

listener 8883
protocol mqtt
# Uncomment and configure for TLS in production:
# cafile /etc/mosquitto/certs/ca.crt
# certfile /etc/mosquitto/certs/server.crt
# keyfile /etc/mosquitto/certs/server.key
# require_certificate false

persistence true
persistence_location /var/lib/mosquitto/
log_dest file /var/log/mosquitto/mosquitto.log
log_type all
EOF

systemctl restart mosquitto
systemctl enable mosquitto
echo -e "${GREEN}✅ Mosquitto MQTT Broker installed${NC}"

echo -e "${YELLOW}Step 6: Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g pm2

echo -e "${GREEN}✅ Node.js and PM2 installed${NC}"

echo -e "${YELLOW}Step 7: Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx

# Create basic Nginx config for Growloc
cat > /etc/nginx/sites-available/growloc << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /var/www/growloc/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket for Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/growloc /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Nginx installed and configured${NC}"

echo -e "${YELLOW}Step 8: Setting up firewall...${NC}"
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 5432/tcp    # PostgreSQL (restrict in production)
ufw allow 1883/tcp    # MQTT
ufw allow 8883/tcp    # MQTT over TLS
ufw --force enable

echo -e "${GREEN}✅ Firewall configured${NC}"

echo -e "${YELLOW}Step 9: Creating application directories...${NC}"
mkdir -p /var/www/growloc/{frontend,backend}
chown -R www-data:www-data /var/www/growloc

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ VPS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update PostgreSQL password:"
echo "   sudo -u postgres psql -c \"ALTER USER growloc_user WITH PASSWORD 'your_strong_password';\""
echo ""
echo "2. Configure MQTT authentication (production):"
echo "   mosquitto_passwd -c /etc/mosquitto/passwd growloc_mqtt"
echo ""
echo "3. Deploy backend application:"
echo "   - Copy backend code to /var/www/growloc/backend"
echo "   - Configure .env with database credentials"
echo "   - Run: cd /var/www/growloc/backend && npm install && npm run build"
echo "   - Start with PM2: pm2 start dist/index.js --name growloc-backend"
echo ""
echo "4. Deploy frontend:"
echo "   - Copy frontend build to /var/www/growloc/frontend"
echo ""
echo "5. Set up SSL with Let's Encrypt:"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d yourdomain.com"
echo ""
echo -e "${YELLOW}Service URLs:${NC}"
echo "- Frontend: http://$(hostname -I | awk '{print $1}')"
echo "- Backend API: http://$(hostname -I | awk '{print $1}')/api"
echo "- PostgreSQL: localhost:5432"
echo "- MQTT: localhost:1883 (non-TLS), localhost:8883 (TLS)"
echo ""
echo -e "${GREEN}Setup complete! 🎉${NC}"
