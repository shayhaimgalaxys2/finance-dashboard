#!/bin/bash
set -e

echo "=== Finance Dashboard - Oracle Cloud Setup ==="
echo ""

# Update system
echo "[1/5] Updating system..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes."
fi
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose plugin
echo "[3/5] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
fi

# Open firewall ports
echo "[4/5] Configuring firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true

# Clone and deploy
echo "[5/5] Deploying application..."
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
echo "  sudo docker compose logs -f     # View logs"
echo "  sudo docker compose restart     # Restart app"
echo "  sudo docker compose down        # Stop app"
echo "  sudo docker compose up -d       # Start app"
