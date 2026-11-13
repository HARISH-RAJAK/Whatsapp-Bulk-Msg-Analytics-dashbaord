<?php
declare(strict_types=1);

/**
 * ClickNCult - Messages List API Endpoint
 * GET /api/messages/list.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/timezone.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/MessageService.php';

ApiResponse::handleCors();
AuthMiddleware::requireAuth();

try {
    $pagination = Validator::parsePagination($_GET, 25, 100);
    $sortBy = $_GET['sort_by'] ?? 'created_at';
    $sortDir = $_GET['sort_dir'] ?? 'DESC';

    // Parse date filters if provided
    $dateFilter = [];
    if (!empty($_GET['preset'])) {
        $dateFilter = TimezoneHelper::resolveDateRangeFilter($_GET['preset'], $_GET['start_date'] ?? null, $_GET['end_date'] ?? null);
    }

    $filters = [
        'search' => $_GET['search'] ?? null,
        'status' => $_GET['status'] ?? null,
        'campaign' => $_GET['campaign'] ?? null,
        'template' => $_GET['template'] ?? null,
        'customer_number' => $_GET['customer_number'] ?? null,
        'start_date' => $dateFilter['start_utc'] ?? null,
        'end_date' => $dateFilter['end_utc'] ?? null,
    ];

    $messageService = new MessageService();
    $result = $messageService->listMessages(
        $filters,
        $pagination['page'],
        $pagination['limit'],
        $sortBy,
        $sortDir
    );

    ApiResponse::success($result, 'Messages retrieved successfully');
} catch (Throwable $e) {
    error_log("Messages List Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve messages.', 500);
}

