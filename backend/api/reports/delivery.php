<?php
declare(strict_types=1);

/**
 * ClickNCult - Delivery Reports API Endpoint
 * GET /api/reports/delivery.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/timezone.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/AnalyticsService.php';
require_once __DIR__ . '/../../services/MessageService.php';

ApiResponse::handleCors();
AuthMiddleware::requireAuth();

try {
    $preset = $_GET['preset'] ?? 'last_30_days';
    $customStart = $_GET['start_date'] ?? null;
    $customEnd = $_GET['end_date'] ?? null;
    $dateFilter = TimezoneHelper::resolveDateRangeFilter($preset, $customStart, $customEnd);

    $analytics = new AnalyticsService();
    $summary = $analytics->getSummary($dateFilter);

    // Get list of delivered messages with pagination
    $pagination = Validator::parsePagination($_GET, 25, 100);
    $messageService = new MessageService();
    $messages = $messageService->listMessages([
        'status' => 'Delivered',
        'start_date' => $dateFilter['start_utc'],
        'end_date' => $dateFilter['end_utc'],
    ], $pagination['page'], $pagination['limit'], 'delivered_at', 'DESC');

    ApiResponse::success([
        'summary' => $summary['kpis'],
        'messages' => $messages,
        'date_filter' => $dateFilter,
    ], 'Delivery reports retrieved successfully');
} catch (Throwable $e) {
    error_log("Delivery Reports Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve delivery reports.', 500);
}

