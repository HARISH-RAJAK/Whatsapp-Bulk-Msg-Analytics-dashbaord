#!/usr/bin/env bash
# ==============================================================================
# ClickNCult - Automated Production Deployment Script (deploy.sh)
# Target Domain: msg.clickncult.com
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo " Starting ClickNCult Deployment for: msg.clickncult.com"
echo " Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================================"

# Target deployment directory (can be overridden by environment variable TARGET_DIR)
TARGET_DIR="${TARGET_DIR:-/var/www/msg.clickncult.com}"
BACKUP_DIR="${BACKUP_DIR:-/var/www/backups/clickncult_$(date +%Y%m%d_%H%M%S)}"
WEB_USER="${WEB_USER:-www-data}"

echo ">> Target Directory: $TARGET_DIR"

# 1. Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# 2. Backup existing deployment (if exists)
if [ -f "$TARGET_DIR/index.html" ]; then
    echo ">> Creating backup in: $BACKUP_DIR"
    mkdir -p "$(dirname "$BACKUP_DIR")"
    cp -r "$TARGET_DIR" "$BACKUP_DIR"
    echo "✔ Backup created."
fi

# 3. Synchronize / Copy new files into target directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo ">> Deploying files from: $SCRIPT_DIR to $TARGET_DIR"

# Backup existing server backend/.env before sync so it is NEVER overwritten
TEMP_ENV_BACKUP="/tmp/clickncult_backend_env_backup"
if [ -f "$TARGET_DIR/backend/.env" ]; then
    cp "$TARGET_DIR/backend/.env" "$TEMP_ENV_BACKUP"
fi

# Copy assets, index.html, .htaccess, and backend
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

# 4. Restore preserved production backend/.env
if [ -f "$TEMP_ENV_BACKUP" ]; then
    echo "✔ Restored server's existing backend/.env (DB credentials preserved)."
    cp "$TEMP_ENV_BACKUP" "$TARGET_DIR/backend/.env"
    rm -f "$TEMP_ENV_BACKUP"
elif [ ! -f "$TARGET_DIR/backend/.env" ] && [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
    cp "$SCRIPT_DIR/backend/.env.example" "$TARGET_DIR/backend/.env"
fi

# If DB password provided via CI secret, update backend/.env
if [ -n "${PRODUCTION_DB_PASSWORD:-}" ]; then
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$PRODUCTION_DB_PASSWORD|" "$TARGET_DIR/backend/.env" 2>/dev/null || true
fi

# 5. Set proper Linux permissions
echo ">> Setting file and directory permissions..."
if id "$WEB_USER" >/dev/null 2>&1; then
    chown -R "$WEB_USER:$WEB_USER" "$TARGET_DIR" || true
fi

find "$TARGET_DIR" -type d -exec chmod 755 {} +
find "$TARGET_DIR" -type f -exec chmod 644 {} +

# Secure backend/.env
chmod 600 "$TARGET_DIR/backend/.env" 2>/dev/null || true

# 6. Optional: Restart / Reload PHP-FPM and Web server
echo ">> Checking for PHP-FPM / Web server reload..."
if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet php8.2-fpm; then
        sudo systemctl reload php8.2-fpm || true
    elif systemctl is-active --quiet php8.3-fpm; then
        sudo systemctl reload php8.3-fpm || true
    elif systemctl is-active --quiet php-fpm; then
        sudo systemctl reload php-fpm || true
    fi

    if systemctl is-active --quiet nginx; then
        sudo systemctl reload nginx || true
    elif systemctl is-active --quiet apache2; then
        sudo systemctl reload apache2 || true
    elif systemctl is-active --quiet httpd; then
        sudo systemctl reload httpd || true
    fi
fi

# 7. Post-Deployment Verification
echo ">> Deployment completed successfully!"
echo ">> Application live at: https://msg.clickncult.com"
echo ">> Webhook endpoint:    https://msg.clickncult.com/backend/webhooks/msg91-whatsapp.php"
echo "======================================================================"
