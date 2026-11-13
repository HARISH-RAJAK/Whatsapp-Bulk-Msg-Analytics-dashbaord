<?php
declare(strict_types=1);

/**
 * ClickNCult - Daily Trends Analytics API Endpoint
 * GET /api/analytics/daily.php
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
    $dailyTrends = $analytics->getDailyTrends($dateFilter);
    $hourly = $analytics->getHourlyDistribution($dateFilter);

    ApiResponse::success([
        'daily_trends' => $dailyTrends,
        'hourly_distribution' => $hourly,
        'date_filter' => $dateFilter,
    ], 'Daily and hourly trends retrieved successfully');
} catch (Throwable $e) {
    error_log("Daily Analytics Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve daily analytics.', 500);
}

