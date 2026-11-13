# ClickNCult – WhatsApp Analytics Management Platform

**ClickNCult** is an independent, production-ready WhatsApp Analytics Management Platform designed to receive, process, deduplicate, and analyze outbound WhatsApp delivery reports sent from the **MSG91 Dashboard** via webhooks.

Built with a high-performance **React + Vite** frontend, a secure **Core PHP 8.2+** backend, and a robust **MySQL 8+** database.

---

## 🚀 Key Highlights & Architectural Features

- **Branding:** Prominently displays ClickNCult branding with quick navigation to Dashboard.
- **Strict Unique Message Analytics:** Distinguishes unique message recipients from repeated status events. Milestones (`Submitted`, `Sent`, `Delivered`, `Read`, `Failed`) are accumulated accurately.
- **Formulas with Verified Denominators:**
  - $\text{Delivery Rate} = \frac{\text{Delivered}}{\text{Eligible Submitted}} \times 100$
  - $\text{Read Rate} = \frac{\text{Read}}{\text{Delivered}} \times 100$
  - $\text{Failure Rate} = \frac{\text{Failed}}{\text{Eligible Submitted}} \times 100$
- **Out-of-Order Delivery Protection:** Late-arriving events will never regress a `Read` or `Delivered` status back to `Sent` or `Submitted`.
- **Deterministic Deduplication:** SHA-256 event hashing prevents duplicate webhook deliveries from distorting analytics.
- **Multi-Factor Message Identification:**
  1. `uuid` (WhatsApp Message ID / wamid)
  2. `crqid` + `customerNumber` (stable MSG91 message identity)
  3. `requestId` + `customerNumber` + `integratedNumber`
  4. Unmatched events logged safely for administrator review without corrupting data.
- **Dual Timezone Architecture:** Database timestamps stored in **UTC**; all displays, daily aggregations, and charts presented in **Asia/Kolkata (IST)**.
- **Export Engine:** Instant CSV export for Messages, Delivered Logs, Failure Audits, and Campaigns.

---

## 📁 Project Structure

```
clickncult-whatsapp-analytics/
├── frontend/                     # React + Vite Application
│   ├── src/
│   │   ├── components/           # UI Cards, Badges, Modals, Pagination
│   │   ├── context/              # Auth & Global Date Filter Contexts
│   │   ├── layouts/              # DashboardLayout & Sidebar
│   │   ├── pages/                # Dashboard, Campaigns, Messages, etc.
│   │   ├── services/             # Axios API Client & Seed Data Engine
│   │   ├── App.jsx               # React Router DOM Routes
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                      # Core PHP 8.2+ Backend (No Laravel, No Node)
│   ├── config/                   # App & Database PDO Singleton
│   ├── helpers/                  # Response, Timezone (IST/UTC), Validator
│   ├── middleware/               # Session Auth & CSRF Protection
│   ├── services/                 # WebhookService, MessageService, AnalyticsService
│   ├── webhooks/                 # msg91-whatsapp.php (Public Webhook)
│   ├── api/                      # REST API Endpoints
│   │   ├── auth/                 # login.php, logout.php, me.php
│   │   ├── dashboard/            # summary.php, trends.php
│   │   ├── messages/             # list.php, details.php
│   │   ├── campaigns/            # list.php, details.php
│   │   ├── reports/              # delivery.php, failed.php
│   │   ├── analytics/            # templates.php, daily.php
│   │   ├── export/               # messages.php (CSV Export)
│   │   └── settings/             # index.php (System health & Profile)
│   ├── bin/                      # CLI tools (create_admin.php)
│   └── .htaccess                 # Apache routing & security rules
├── database/
│   └── schema.sql                # Complete MySQL 8+ Schema & Admin Seed
├── docs/
│   ├── API.md                    # REST API Reference
│   ├── WEBHOOK_SETUP.md          # MSG91 Dashboard Configuration Guide
│   └── DEPLOYMENT.md             # Production Server Setup Guide
├── tests/                        # Test Suites & Fixtures
│   ├── fixtures/                 # 12 Sample Webhook Payloads
│   ├── run_tests.php             # PHP In-Memory SQLite Test Suite
│   └── verify_suite.js           # Node.js End-to-End Verification Suite
├── README.md
└── .gitignore
```

---

## 🛠️ Quick Start & Local Development

### 1. Database Setup
Ensure MySQL is running, then import the schema:
```bash
mysql -u root -p < database/schema.sql
```

Default administrator credentials created by `schema.sql`:
- **Email:** `admin@clickncult.com`
- **Password:** `Admin@ClickNCult2026!`

To reset or create a new administrator from the command line:
```bash
php backend/bin/create_admin.php "Administrator" "admin@clickncult.com" "YourPassword123!"
```

### 2. Configure Environment Variables (.env)

Both frontend and backend URLs are decoupled and managed via `.env` files.

#### A. Backend Configuration (`backend/.env`):
```env
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=clickncult_analytics
DB_USERNAME=root
DB_PASSWORD=

MSG91_WEBHOOK_SECRET=
MSG91_REQUIRE_AUTH=false
```

#### B. Frontend Configuration (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Start the Backend PHP Server
From the project root:
```bash
php -S localhost:8000 -t .
```

### 4. Start the Frontend React Application
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: **`http://localhost:5173`**

Log in using `admin@clickncult.com` / `Admin@ClickNCult2026!`.

*(Note: If the PHP backend is not running, the frontend automatically activates its seed demo mode so all charts, tables, inspectors, and exports remain interactive without breaking)*.

---

## 🧪 Testing & Verification

Run the comprehensive 16-point automated verification suite covering all 12 Master Project Prompt scenarios:
```bash
# Node.js automated verification suite:
node tests/verify_suite.js

# Standalone PHP test suite (when PHP is installed):
php tests/run_tests.php
```

All 12 scenarios are verified:
1. Valid Delivered event
2. Valid Read event
3. Valid Failed event
4. Duplicate event suppression
5. Out-of-order event protection (Read not regressed to Sent)
6. Unknown event preserved in audit history
7. Missing UUID resolved via stable identifiers
8. Missing campaign preserved without fake names
9. Multiple recipients in one campaign not merged
10. Invalid JSON handled safely with HTTP error
11. Webhook source authentication
12. Database failure / unmatched event recovery

---

## 📡 Webhook Configuration in MSG91

In your **MSG91 Dashboard** → **WhatsApp** → **Settings** → **Webhooks**:

- **Webhook Name:** `CLICKNCULT_REPORTS`
- **Service:** `WhatsApp`
- **Event:** `On Outbound Report Received`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **URL:** `https://your-domain.com/backend/webhooks/msg91-whatsapp.php`

For detailed setup and secret token authentication, refer to [`docs/WEBHOOK_SETUP.md`](docs/WEBHOOK_SETUP.md).

---

## 🛡️ Security & Production Readiness

- Passwords hashed with `password_hash()` and verified with `password_verify()`.
- Sessions configured with `HttpOnly`, `SameSite=Lax`, and `Secure` cookies.
- CSRF tokens required on state-mutating requests (`X-CSRF-Token`).
- Real PDO prepared statements with strict typing.
- Database errors and internal stack traces are logged server-side and never exposed to the client.
- Production build ready: `cd frontend && npm run build`.

