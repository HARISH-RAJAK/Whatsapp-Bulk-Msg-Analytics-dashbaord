# ClickNCult – MSG91 WhatsApp Webhook Integration Guide

This guide details how to configure MSG91 to stream outbound WhatsApp delivery reports directly into ClickNCult.

---

## 1. MSG91 Dashboard Configuration

Log into your **MSG91 Dashboard** and navigate to:
**WhatsApp** → **Settings** → **Webhooks** → **Create Webhook**

Enter the following configuration parameters:

| Setting Parameter | Configuration Value |
| :--- | :--- |
| **Webhook Name** | `CLICKNCULT_REPORTS` |
| **Service** | `WhatsApp` |
| **Event** | `On Outbound Report Received` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |
| **Status** | `Enabled` |
| **URL** | `https://<YOUR-DOMAIN>/backend/webhooks/msg91-whatsapp.php` |

*(If using token authentication, append `?token=<YOUR_SECRET>` to the URL)*

---

## 2. Authentication & Verification

MSG91 supports transmitting webhook reports to HTTPS endpoints. ClickNCult supports two verified authentication methods:

### Method A: Token Query Parameter (Recommended for MSG91)
In the MSG91 webhook URL field, configure:
```
https://<YOUR-DOMAIN>/backend/webhooks/msg91-whatsapp.php?token=my_secret_token_123
```
In your ClickNCult backend environment (`.env` or Apache environment variables):
```env
MSG91_WEBHOOK_SECRET=my_secret_token_123
MSG91_REQUIRE_AUTH=true
```

### Method B: Custom Header
If configured to pass custom headers, MSG91 sends `X-Webhook-Secret: my_secret_token_123`. ClickNCult checks this header using constant-time string comparison (`hash_equals`) to prevent timing attacks.

> [!NOTE]
> If `MSG91_REQUIRE_AUTH` is set to `false` or left unconfigured, the endpoint operates in open acceptance mode while still enforcing complete deduplication and payload validation.

---

## 3. Data Integrity & Deduplication Architecture

### A. Message Identification Priority
MSG91 delivery reports may arrive in varying formats depending on campaign type. ClickNCult resolves message identities using this strict priority hierarchy:
1. `uuid`: WhatsApp Message ID (e.g., `wamid.HBgMOTE4MTU4...`).
2. `crqid` + `customerNumber`: Verified stable MSG91 message identifier combined with recipient number.
3. `requestId` + `customerNumber` + `integratedNumber`: Dispatched batch identifier per recipient.
4. **Unmatched Events**: If none of these identifiers exist (or in cases of provider test pings), the event is recorded in `webhook_logs` with status `unmatched` for administrator review. Unmatched events never corrupt analytics.

### B. SHA-256 Event Hashing & Deduplication
Network retries from MSG91 could result in duplicate HTTP deliveries. ClickNCult calculates a unique event hash:
```
SHA-256( message_key | EVENT_NAME | status_code | event_timestamp_utc | reason )
```
- If this hash is already present in `whatsapp_message_events`, the duplicate event is suppressed and logged with status `duplicate`.
- HTTP `200 OK` is returned so MSG91 acknowledges successful delivery without triggering unnecessary retries.

### C. Out-of-Order Delivery Protection
MSG91 webhook events may not arrive in chronological order due to carrier network delays (e.g. a `Sent` report might arrive after a `Delivered` or `Read` report).
ClickNCult enforces status precedence weights:
- `Read` (40) > `Delivered` (30) > `Sent` (20) > `Submitted` (10) > `Unknown` (0)
- A late-arriving `Sent` or `Submitted` event will update milestone timestamps (`sent_at`, `submitted_at`) and be recorded in the audit history timeline, but will **never** regress `current_status` from `Read` or `Delivered`.
- A message with a `Read` event is automatically guaranteed the `Delivered` milestone.

---

## 4. MSG91 Dashboard "Test Run" Handling

When clicking "Test Webhook" in the MSG91 dashboard, MSG91 sends a dummy ping:
```json
{
  "test": true,
  "service": "whatsapp",
  "eventName": "test_connection"
}
```
ClickNCult identifies this test payload, stores it in `webhook_logs` under status `unmatched` or `ignored`, and returns `200 OK`. It is **never** added to your customer messages table or analytics totals.

---

## 5. Webhook Verification Checklist

- [x] HTTPS enabled with valid SSL certificate on your server.
- [x] Endpoint reachable via POST request (`/backend/webhooks/msg91-whatsapp.php`).
- [x] Database `clickncult_analytics` initialized with `database/schema.sql`.
- [x] `MSG91_WEBHOOK_SECRET` matched between MSG91 and ClickNCult.
- [x] Send a real test message from MSG91 dashboard to verify status updates in real-time.

