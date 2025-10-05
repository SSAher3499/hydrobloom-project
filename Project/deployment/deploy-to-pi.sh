#!/bin/bash
# Deployment script for Growloc Pi Controller
# Usage: ./deploy-to-pi.sh pi@192.168.1.100

set -e

PI_USER_HOST=$1

if [ -z "$PI_USER_HOST" ]; then
    echo "Usage: ./deploy-to-pi.sh pi@192.168.1.100"
    exit 1
fi

echo "🚀 Deploying Growloc Pi Controller to $PI_USER_HOST..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building application...${NC}"
cd ../pi-controller
npm run build

echo -e "${YELLOW}Step 2: Creating deployment package...${NC}"
tar -czf /tmp/growloc-pi-controller.tar.gz \
    --exclude='node_modules' \
    --exclude='data/*.db' \
    --exclude='logs/*.log' \
    --exclude='.git' \
    .

echo -e "${YELLOW}Step 3: Copying files to Raspberry Pi...${NC}"
scp /tmp/growloc-pi-controller.tar.gz $PI_USER_HOST:/tmp/

echo -e "${YELLOW}Step 4: Installing on Raspberry Pi...${NC}"
ssh $PI_USER_HOST << 'EOF'
    set -e

    echo "📦 Extracting package..."
    mkdir -p /home/pi/growloc-pi-controller
    cd /home/pi/growloc-pi-controller
    tar -xzf /tmp/growloc-pi-controller.tar.gz

    echo "📦 Installing dependencies..."
    npm install --production

    echo "📝 Creating data and logs directories..."
    mkdir -p data logs

    echo "⚙️  Setting up systemd service..."
    sudo cp systemd/growloc-pi-controller.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable growloc-pi-controller

    echo "🔄 Restarting service..."
    sudo systemctl restart growloc-pi-controller

    echo "✅ Deployment complete!"
    echo "📊 Service status:"
    sudo systemctl status growloc-pi-controller --no-pager
EOF

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${YELLOW}View logs with: ssh $PI_USER_HOST 'sudo journalctl -u growloc-pi-controller -f'${NC}"
