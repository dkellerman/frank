#!/usr/bin/env bash
set -euo pipefail

# Configuration
APP_DIR="${APP_DIR:-/opt/frank}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
SERVICE_NAME="${SERVICE_NAME:-frank}"
USER_NAME="${USER_NAME:-ubuntu}"
GROUP_NAME="${GROUP_NAME:-ubuntu}"
PORT="${PORT:-8000}"

# Ensure base packages
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
fi

if ! command -v ${PYTHON_BIN} >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3 python3-venv python3-pip
fi

# App directory and permissions
sudo mkdir -p "${APP_DIR}"
sudo chown -R "${USER_NAME}:${GROUP_NAME}" "${APP_DIR}"
cd "${APP_DIR}"

# Python venv
if [ ! -d ".venv" ]; then
  ${PYTHON_BIN} -m venv .venv
fi
source .venv/bin/activate

# Install Python deps
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
else
  pip install uvicorn[standard] fastapi
fi

# Systemd service
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "Creating systemd service ${SERVICE_FILE}"
sudo tee "${SERVICE_FILE}" >/dev/null <<EOF
[Unit]
Description=Frank FastAPI Service
After=network.target

[Service]
Type=simple
User=${USER_NAME}
Group=${GROUP_NAME}
WorkingDirectory=${APP_DIR}
Environment=PYTHONUNBUFFERED=1
Environment=PORT=${PORT}
Environment=APP_ENV=production
EnvironmentFile=${APP_DIR}/.env
ExecStart=${APP_DIR}/.venv/bin/uvicorn main:app --host 127.0.0.1 --port ${PORT} --workers 2
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"

# Nginx reverse proxy
NGINX_SITE="/etc/nginx/sites-available/${SERVICE_NAME}"
NGINX_LINK="/etc/nginx/sites-enabled/${SERVICE_NAME}"

echo "Configuring nginx reverse proxy ${NGINX_SITE}"
sudo tee "${NGINX_SITE}" >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    # Accept any Host; Cloudflare will sit in front and set Host header
    server_name _;

    # Increase proxy buffer sizes for streaming
    proxy_buffering off;

    # API HTTP endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket endpoint
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check passthrough (optional)
    location = /api/healthz {
        proxy_pass http://127.0.0.1:8000;
    }

    # Everything else is static on CloudFront. Optionally return 404 here.
    location / { return 404; }
}
EOF

# Enable site
sudo ln -sf "${NGINX_SITE}" "${NGINX_LINK}"
sudo rm -f /etc/nginx/sites-enabled/default || true
sudo nginx -t
sudo systemctl reload nginx

echo "Setup complete. Service status:"
sudo systemctl --no-pager status "${SERVICE_NAME}" | cat