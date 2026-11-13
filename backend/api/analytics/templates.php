<?php
declare(strict_types=1);

/**
 * ClickNCult - Templates Analytics API Endpoint
 * GET /api/analytics/templates.php
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
    $templates = $analytics->getTemplateAnalytics($dateFilter, 50);

    ApiResponse::success([
        'templates' => $templates,
        'date_filter' => $dateFilter,
    ], 'Template analytics retrieved successfully');
} catch (Throwable $e) {
    error_log("Templates Analytics Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve template analytics.', 500);
}

