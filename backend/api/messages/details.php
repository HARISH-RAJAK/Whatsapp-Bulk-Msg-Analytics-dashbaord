<?php
declare(strict_types=1);

/**
 * ClickNCult - Message Details API Endpoint
 * GET /api/messages/details.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/MessageService.php';

ApiResponse::handleCors();
AuthMiddleware::requireAuth();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    ApiResponse::error('A valid message ID is required.', 422);
}

try {
    $messageService = new MessageService();
    $details = $messageService->getMessageDetails($id);

    if (!$details) {
        ApiResponse::notFound('Message record not found.');
    }

    ApiResponse::success($details, 'Message details retrieved successfully');
} catch (Throwable $e) {
    error_log("Message Details Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve message details.', 500);
}

