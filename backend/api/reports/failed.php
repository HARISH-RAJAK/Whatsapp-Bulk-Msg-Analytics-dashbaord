<?php
declare(strict_types=1);

/**
 * ClickNCult - Failed Messages Report API Endpoint
 * GET /api/reports/failed.php
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
    $failureReasons = $analytics->getFailureReports($dateFilter, 50);

    $pagination = Validator::parsePagination($_GET, 25, 100);
    $messageService = new MessageService();
    $messages = $messageService->listMessages([
        'status' => 'Failed',
        'start_date' => $dateFilter['start_utc'],
        'end_date' => $dateFilter['end_utc'],
    ], $pagination['page'], $pagination['limit'], 'created_at', 'DESC');

    ApiResponse::success([
        'failure_reasons' => $failureReasons,
        'messages' => $messages,
        'date_filter' => $dateFilter,
    ], 'Failed messages report retrieved successfully');
} catch (Throwable $e) {
    error_log("Failed Reports Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve failed message report.', 500);
}

