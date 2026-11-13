#!/usr/bin/env bash
# ==============================================================================
# ClickNCult - Production Server Deployment Script
# Target Domain: msg.clickncult.com
# ==============================================================================

set -euo pipefail

TARGET_DIR="${TARGET_DIR:-/var/www/msg.clickncult.com}"
WEB_USER="${WEB_USER:-www-data}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================================"
echo ">> Deploying ClickNCult to: $TARGET_DIR"
echo "======================================================================"

# 1. Ensure target directory exists
mkdir -p "$TARGET_DIR"

# 2. Backup existing server backend/.env so database password is NEVER overwritten
TEMP_ENV_BACKUP="/tmp/clickncult_backend_env_backup"
if [ -f "$TARGET_DIR/backend/.env" ]; then
    cp "$TARGET_DIR/backend/.env" "$TEMP_ENV_BACKUP"
    echo "✔ Backed up server's existing backend/.env"
fi

# 3. Synchronize new release files into target directory
if command -v rsync >/dev/null 2>&1; then
    rsync -av --delete \
        --exclude='.git*' \
        --exclude='node_modules' \
        --exclude='tests' \
        --exclude='deploy.sh' \
        "$SCRIPT_DIR/" "$TARGET_DIR/"
else
    cp -r "$SCRIPT_DIR/"* "$TARGET_DIR/" 2>/dev/null || true
    cp -r "$SCRIPT_DIR/".[!.]* "$TARGET_DIR/" 2>/dev/null || true
fi

# 4. Restore server's existing backend/.env untouched
if [ -f "$TEMP_ENV_BACKUP" ]; then
    cp "$TEMP_ENV_BACKUP" "$TARGET_DIR/backend/.env"
    rm -f "$TEMP_ENV_BACKUP"
    echo "✔ Preserved server's existing backend/.env"
elif [ ! -f "$TARGET_DIR/backend/.env" ] && [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
    cp "$SCRIPT_DIR/backend/.env.example" "$TARGET_DIR/backend/.env"
    echo ">> Created initial backend/.env from template."
fi

# 5. Set proper permissions
echo ">> Setting file permissions..."
if id "$WEB_USER" >/dev/null 2>&1; then
    chown -R "$WEB_USER:$WEB_USER" "$TARGET_DIR" || true
fi

find "$TARGET_DIR" -type d -exec chmod 755 {} +
find "$TARGET_DIR" -type f -exec chmod 644 {} +
chmod 600 "$TARGET_DIR/backend/.env" 2>/dev/null || true

# 6. Reload PHP-FPM / Web server if running
echo ">> Reloading web server & PHP services..."
if command -v systemctl >/dev/null 2>&1; then
    for service in php8.2-fpm php8.3-fpm php-fpm nginx apache2 httpd; do
        if systemctl is-active --quiet "$service"; then
            sudo systemctl reload "$service" 2>/dev/null || true
        fi
    done
fi

echo "======================================================================"
echo "✔ Deployment complete! Application is live at: https://msg.clickncult.com"
echo "======================================================================"
