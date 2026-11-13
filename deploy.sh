#!/usr/bin/env bash
# ==============================================================================
# ClickNCult - Production Deployment Script for Hostinger / Shared Hosting
# Target Domain: msg.clickncult.com
# Path: ~/domains/msg.clickncult.com/public_html
# ==============================================================================

set -euo pipefail

# Auto-detect Hostinger domains path if not explicitly provided
if [ -z "${TARGET_DIR:-}" ]; then
    if [ -d "$HOME/domains/msg.clickncult.com/public_html" ]; then
        TARGET_DIR="$HOME/domains/msg.clickncult.com/public_html"
    elif [ -d "domains/msg.clickncult.com/public_html" ]; then
        TARGET_DIR="$PWD/domains/msg.clickncult.com/public_html"
    else
        TARGET_DIR="$HOME/domains/msg.clickncult.com/public_html"
    fi
elif [[ "$TARGET_DIR" != /* ]]; then
    # If relative path was passed (e.g. domains/msg.clickncult.com/public_html)
    TARGET_DIR="$HOME/$TARGET_DIR"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================================"
echo " Starting ClickNCult Deployment for: msg.clickncult.com"
echo " User:       $(whoami)"
echo " From:       $SCRIPT_DIR"
echo " Target Dir: $TARGET_DIR"
echo " Date:       $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================================"

# 1. Ensure target public_html directory exists
mkdir -p "$TARGET_DIR"

# 2. Preserve existing server's backend/.env (DB password is NEVER overwritten)
TEMP_ENV_BACKUP="$HOME/.clickncult_backend_env_backup"
if [ -f "$TARGET_DIR/backend/.env" ]; then
    cp "$TARGET_DIR/backend/.env" "$TEMP_ENV_BACKUP"
    echo "✔ Preserved server's existing backend/.env (database credentials safe)"
fi

# 3. Synchronize new release files into target public_html
echo ">> Synchronizing frontend assets and backend files..."
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
    echo "✔ Restored existing backend/.env successfully."
elif [ ! -f "$TARGET_DIR/backend/.env" ] && [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
    cp "$SCRIPT_DIR/backend/.env.example" "$TARGET_DIR/backend/.env"
    echo ">> Initialized backend/.env from template (Please configure DB credentials)."
fi

# 5. Set proper permissions (Hostinger standards: 755 for dirs, 644 for files, 600 for .env)
echo ">> Setting permissions..."
find "$TARGET_DIR" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$TARGET_DIR" -type f -exec chmod 644 {} + 2>/dev/null || true
chmod 600 "$TARGET_DIR/backend/.env" 2>/dev/null || true

# 6. Touch index.html and .htaccess to refresh server cache
touch "$TARGET_DIR/index.html" 2>/dev/null || true
touch "$TARGET_DIR/.htaccess" 2>/dev/null || true

echo "======================================================================"
echo "✔ Deployment complete!"
echo "   Website:  https://msg.clickncult.com"
echo "   Webhook:  https://msg.clickncult.com/backend/webhooks/msg91-whatsapp.php"
echo "======================================================================"
