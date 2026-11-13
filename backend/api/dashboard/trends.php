<?php
declare(strict_types=1);

/**
 * ClickNCult - Dashboard Trends & Charts API Endpoint
 * GET /api/dashboard/trends.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/timezone.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/AnalyticsService.php';
require_once __DIR__ . '/../../services/CampaignService.php';

ApiResponse::handleCors();
AuthMiddleware::requireAuth();

try {
    $preset = $_GET['preset'] ?? 'last_30_days';
    $customStart = $_GET['start_date'] ?? null;
    $customEnd = $_GET['end_date'] ?? null;

    $dateFilter = TimezoneHelper::resolveDateRangeFilter($preset, $customStart, $customEnd);

    $analytics = new AnalyticsService();
    $campaignService = new CampaignService();

    $dailyTrends = $analytics->getDailyTrends($dateFilter);
    $hourlyDistribution = $analytics->getHourlyDistribution($dateFilter);
    $templatePerformance = $analytics->getTemplateAnalytics($dateFilter, 10);
    $topCampaigns = $campaignService->listCampaigns([
        'start_date' => $dateFilter['start_utc'],
        'end_date' => $dateFilter['end_utc'],
    ], 1, 10, 'total_messages', 'DESC');

    ApiResponse::success([
        'daily_trends' => $dailyTrends,
        'hourly_distribution' => $hourlyDistribution,
        'template_performance' => $templatePerformance,
        'top_campaigns' => $topCampaigns['items'] ?? [],
        'date_filter' => $dateFilter,
    ], 'Dashboard trends retrieved successfully');
} catch (Throwable $e) {
    error_log("Dashboard Trends Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve trend analytics.', 500);
}

