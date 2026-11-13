<?php
declare(strict_types=1);

/**
 * ClickNCult - MSG91 Outbound WhatsApp Delivery Report Webhook Endpoint
 * 
 * Configured in MSG91 Dashboard:
 * Webhook Name: CLICKNCULT_REPORTS
 * Service: WhatsApp
 * Event: On Outbound Report Received
 * Method: POST
 * Content-Type: application/json
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../services/WebhookService.php';

// Allow OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ApiResponse::handleCors();
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method Not Allowed. Use POST.', 405);
}

$webhookService = new WebhookService();

// Verify webhook authentication if enforced
if (!$webhookService->verifyWebhookSource()) {
    ApiResponse::unauthorized('Invalid or missing webhook signature/token');
}

// Read raw body
$rawInput = file_get_contents('php://input');
if (empty($rawInput)) {
    ApiResponse::error('Empty webhook payload', 400);
}

$decoded = json_decode($rawInput, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    ApiResponse::error('Invalid JSON payload: ' . json_last_error_msg(), 400);
}

// Process payload
$result = $webhookService->processPayload($decoded);

if (!empty($result['success'])) {
    ApiResponse::success($result, 'Webhook events processed successfully', 200);
} else {
    // If there were fatal processing issues
    ApiResponse::json($result, 'Webhook processed with warnings/errors', 200, false);
}

