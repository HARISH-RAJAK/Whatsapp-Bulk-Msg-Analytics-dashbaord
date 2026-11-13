# ClickNCult – Production Deployment Guide

This guide covers deploying ClickNCult WhatsApp Analytics to production using PHP 8.2+, MySQL 8+, and an optimized Vite production build.

---

## 1. System Requirements

- **Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) or Windows Server
- **Web Server:** Nginx or Apache 2.4+ (with `mod_rewrite` enabled)
- **PHP Version:** PHP 8.2 or higher
  - Required Extensions: `pdo`, `pdo_mysql`, `mbstring`, `json`, `session`, `openssl`
- **Database:** MySQL 8.0+ or MariaDB 10.5+ (InnoDB engine, `utf8mb4` charset)
- **Node.js:** Node 18+ & npm for compiling Vite frontend

---

## 2. Database Setup

1. Create the MySQL database and import `database/schema.sql`:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS clickncult_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p clickncult_analytics < database/schema.sql
```

2. Initialize or reset the primary administrator account:
```bash
php backend/bin/create_admin.php "ClickNCult Admin" "admin@clickncult.com" "YourSecureProductionPassword!"
```

---

## 3. Backend Environment Configuration

Configure environment variables via `.env`, systemd, or your web server configuration:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://analytics.clickncult.com
FRONTEND_URL=https://analytics.clickncult.com

# Database Credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=clickncult_analytics
DB_USERNAME=clickncult_user
DB_PASSWORD=YourStrongDatabasePassword

# MSG91 Webhook Security
MSG91_WEBHOOK_SECRET=your_configured_webhook_secret_key
MSG91_REQUIRE_AUTH=true
```

---

## 4. Frontend Production Build

1. Navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run build
```
2. The compiled assets will be located in `frontend/dist/`.
3. Copy the contents of `frontend/dist/` into your public webroot (e.g. `/var/www/clickncult/public`).

---

## 5. Web Server Configuration

### Apache Configuration
Ensure `mod_rewrite` and `mod_headers` are enabled:
```bash
a2enmod rewrite headers
```

Sample VirtualHost:
```apache
<VirtualHost *:443>
    ServerName analytics.clickncult.com
    DocumentRoot /var/www/clickncult/public

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/analytics.clickncult.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/analytics.clickncult.com/privkey.pem

    # Serve backend APIs and Webhooks
    Alias /backend /var/www/clickncult/backend
    Alias /api /var/www/clickncult/backend/api

    <Directory /var/www/clickncult/backend>
        AllowOverride All
        Require all granted
    </Directory>

    <Directory /var/www/clickncult/public>
        AllowOverride All
        Require all granted
        # Fallback all routes to index.html for React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name analytics.clickncult.com;

    ssl_certificate /etc/letsencrypt/live/analytics.clickncult.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/analytics.clickncult.com/privkey.pem;

    root /var/www/clickncult/public;
    index index.html;

    # Frontend Single Page App Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend PHP API routing
    location ~ ^/(backend|api)/.+\.php$ {
        root /var/www/clickncult;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/clickncult$fastcgi_script_name;
    }

    # Deny access to sensitive directories
    location ~ ^/(backend/config|backend/bin|\.git) {
        deny all;
    }
}
```

---

## 6. Security Checklist

- [x] **SSL / HTTPS Enforced**: Webhooks and admin sessions are strictly HTTPS.
- [x] **Session Security**: Cookies use `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
- [x] **CSRF Protection**: All mutating session requests require `X-CSRF-Token`.
- [x] **Deduplication**: SHA-256 event hash prevents duplicate event insertion.
- [x] **No Leaked Stack Traces**: Production `display_errors` is disabled in `app.php`.
- [x] **Password Security**: Passwords hashed using standard `PASSWORD_BCRYPT`.
- [x] **Timezone Integrity**: Storage is strictly in UTC, display timezone is `Asia/Kolkata`.

