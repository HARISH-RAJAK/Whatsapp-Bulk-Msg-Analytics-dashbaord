<?php
declare(strict_types=1);

/**
 * ClickNCult - Dashboard Summary API Endpoint
 * GET /api/dashboard/summary.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/timezone.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/AnalyticsService.php';

ApiResponse::handleCors();
AuthMiddleware::requireAuth();

try {
    $preset = $_GET['preset'] ?? 'last_30_days';
    $customStart = $_GET['start_date'] ?? null;
    $customEnd = $_GET['end_date'] ?? null;

    $dateFilter = TimezoneHelper::resolveDateRangeFilter($preset, $customStart, $customEnd);

    $analytics = new AnalyticsService();
    $summary = $analytics->getSummary($dateFilter);

    ApiResponse::success($summary, 'Dashboard summary retrieved successfully');
} catch (Throwable $e) {
    error_log("Dashboard Summary Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve dashboard analytics.', 500);
}

