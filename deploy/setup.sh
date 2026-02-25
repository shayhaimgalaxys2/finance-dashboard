#!/bin/bash
set -e

echo "=== Finance Dashboard - Google Cloud Setup ==="
echo ""

# Update system
echo "[1/4] Updating system..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
echo "[2/4] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed."
fi
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose plugin
echo "[3/4] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
fi

# Clone and deploy
echo "[4/4] Deploying application..."
cd ~
if [ -d "finance-dashboard" ]; then
    cd finance-dashboard
    git pull
else
    git clone https://github.com/shayhaimgalaxys2/finance-dashboard.git
    cd finance-dashboard
fi

# Build and start
sudo docker compose up -d --build

echo ""
echo "=== Setup Complete! ==="
echo ""
PUBLIC_IP=$(curl -s ifconfig.me)
echo "Your app is running at: http://$PUBLIC_IP"
echo ""
echo "Next steps:"
echo "  1. Open http://$PUBLIC_IP in your browser"
echo "  2. Set a master password"
echo "  3. Add your bank accounts"
echo "  4. Configure Telegram in settings"
echo ""
echo "Useful commands:"
echo "  cd ~/finance-dashboard"
echo "  sudo docker compose logs -f     # View logs"
echo "  sudo docker compose restart     # Restart app"
echo "  sudo docker compose down        # Stop app"
echo "  sudo docker compose up -d       # Start app"
