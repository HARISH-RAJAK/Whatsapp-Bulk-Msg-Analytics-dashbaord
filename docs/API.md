# ClickNCult WhatsApp Analytics – API Documentation

All API responses follow the standard JSON response format:
```json
{
  "success": true,
  "message": "Request completed",
  "data": {}
}
```

## Authentication

All private API routes require a valid PHP session cookie (`CLICKNCULT_SESSID`).
Mutating state calls require `X-CSRF-Token` header.

### 1. Admin Login
- **Endpoint:** `POST /api/auth/login.php`
- **Headers:** `Content-Type: application/json`
- **Payload:**
```json
{
  "email": "admin@clickncult.com",
  "password": "YourPassword123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "ClickNCult Admin",
      "email": "admin@clickncult.com",
      "role": "admin"
    },
    "csrf_token": "a1b2c3d4..."
  }
}
```

### 2. Admin Logout
- **Endpoint:** `POST /api/auth/logout.php`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### 3. Current User Profile
- **Endpoint:** `GET /api/auth/me.php`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": 1,
      "name": "ClickNCult Admin",
      "email": "admin@clickncult.com",
      "role": "admin"
    },
    "csrf_token": "a1b2c3d4..."
  }
}
```

---

## Webhook Endpoint (MSG91)

### Inbound Outbound Delivery Report
- **Endpoint:** `POST /backend/webhooks/msg91-whatsapp.php` (or `/api/webhooks/msg91/whatsapp.php`)
- **Headers:** `Content-Type: application/json`
- **Optional Security Header:** `X-Webhook-Secret: <token>`
- **Optional Query Param:** `?token=<token>`
- **Sample Payload:**
```json
{
  "crqid": "testing_crqid",
  "companyId": "444370",
  "requestedAt": "2025-07-15T11:22:55+05:30",
  "customerNumber": "918158812345",
  "content": "Sample message content",
  "requestId": "71152f6355a449218e19cd8f0e3bca8d",
  "reason": "",
  "eventName": "Delivered",
  "uuid": "wamid.sample-uuid-for-webhook-test",
  "integratedNumber": "919028711111",
  "direction": "1",
  "templateName": "sample_template",
  "campaignName": "sample-campaign",
  "campaignRequestId": "camp_12345",
  "templateLanguage": "en",
  "price": "0.10",
  "contentType": "text",
  "messageType": "text",
  "statusCode": "1",
  "statusUpdatedAt": "2025-07-15T11:05:11+05:30",
  "ts": "2026-11-13T16:34:18+05:30",
  "webhookType": "outbound"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook events processed successfully",
  "data": {
    "total": 1,
    "processed": 1,
    "duplicates": 0,
    "unmatched": 0,
    "errors": 0
  }
}
```

---

## Dashboard & Analytics

### 1. Dashboard Summary KPIs
- **Endpoint:** `GET /api/dashboard/summary.php`
- **Query Params:**
  - `preset`: `today` | `yesterday` | `last_7_days` | `last_30_days` | `this_month` | `previous_month` | `custom`
  - `start_date`: `YYYY-MM-DD` (if preset=custom)
  - `end_date`: `YYYY-MM-DD` (if preset=custom)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "kpis": {
      "total_messages": 14850,
      "submitted": 14850,
      "sent": 14620,
      "delivered": 13910,
      "read": 10432,
      "failed": 710,
      "pending": 230,
      "delivery_rate": 93.67,
      "read_rate": 74.99,
      "failure_rate": 4.78,
      "total_cost": 1485.00
    },
    "status_breakdown": {
      "Read": 10432,
      "Delivered": 3478,
      "Sent": 710,
      "Submitted": 230,
      "Failed": 710
    },
    "metadata": {
      "timezone": "Asia/Kolkata",
      "preset": "last_30_days"
    }
  }
}
```

### 2. Dashboard Trends & Distribution
- **Endpoint:** `GET /api/dashboard/trends.php`
- **Query Params:** same as summary
- **Response:** Daily message trends, 24-hour distribution, template benchmarks, and top campaigns.

---

## Messages & Campaigns

### 1. List Messages
- **Endpoint:** `GET /api/messages/list.php`
- **Query Params:** `search`, `status`, `campaign`, `template`, `page`, `limit`, `sort_by`, `sort_dir`, `preset`, `start_date`, `end_date`
- **Response:** Paginated list of messages with normalized status, delivery timestamps in Asia/Kolkata (IST), and pricing.

### 2. Message Detail Inspector
- **Endpoint:** `GET /api/messages/details.php?id=<id>`
- **Response:** Complete message record, milestone audit timeline, and raw webhook event history.

### 3. List Campaigns
- **Endpoint:** `GET /api/campaigns/list.php`
- **Query Params:** `search`, `page`, `limit`, `sort_by`, `sort_dir`, `preset`
- **Response:** Distinct campaigns with aggregate metrics (submitted, delivered, read, failed, rates).

### 4. Campaign Details
- **Endpoint:** `GET /api/campaigns/details.php?id=<identifier>`
- **Response:** Performance breakdown and status metrics for a specific campaign.

---

## Reports & Exports

### 1. Delivery Reports
- **Endpoint:** `GET /api/reports/delivery.php`
- **Response:** Handset delivery milestones and delivered message logs.

### 2. Failed Messages Reports
- **Endpoint:** `GET /api/reports/failed.php`
- **Response:** Failure reason distribution, error status codes, and failed message logs.

### 3. Template Analytics
- **Endpoint:** `GET /api/analytics/templates.php`
- **Response:** Comparative performance benchmarks across registered message templates.

### 4. Export CSV
- **Endpoint:** `GET /api/export/messages.php`
- **Query Params:** `search`, `status`, `campaign`, `preset`, `start_date`, `end_date`
- **Response:** Direct CSV file download formatted in UTF-8 with BOM and Asia/Kolkata timestamps.

