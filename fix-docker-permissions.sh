#!/bin/bash

# Fix Docker socket permissions permanently
# This script ensures Docker can be used without sudo

echo "Fixing Docker permissions..."

# Add current user to docker group if not already added
sudo usermod -aG docker $USER

# Fix socket permissions
sudo chmod 666 /var/run/docker.sock

# Create systemd override to maintain permissions on restart
sudo mkdir -p /etc/systemd/system/docker.socket.d/

sudo tee /etc/systemd/system/docker.socket.d/override.conf > /dev/null <<EOF
[Socket]
SocketMode=0666
EOF

# Reload systemd and restart docker
sudo systemctl daemon-reload
sudo systemctl restart docker.socket docker.service

echo "✅ Docker permissions fixed!"
echo ""
echo "You can now use 'docker' commands without sudo."
echo "If this is your first time, you may need to log out and log back in."
