<?php
declare(strict_types=1);

/**
 * ClickNCult - Campaigns List API Endpoint
 * GET /api/campaigns/list.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/timezone.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/CampaignService.php';

ApiResponse::handleCors();
AuthMiddleware::requireAuth();

try {
    $pagination = Validator::parsePagination($_GET, 25, 100);
    $sortBy = $_GET['sort_by'] ?? 'total_messages';
    $sortDir = $_GET['sort_dir'] ?? 'DESC';

    $dateFilter = [];
    if (!empty($_GET['preset'])) {
        $dateFilter = TimezoneHelper::resolveDateRangeFilter($_GET['preset'], $_GET['start_date'] ?? null, $_GET['end_date'] ?? null);
    }

    $filters = [
        'search' => $_GET['search'] ?? null,
        'start_date' => $dateFilter['start_utc'] ?? null,
        'end_date' => $dateFilter['end_utc'] ?? null,
    ];

    $campaignService = new CampaignService();
    $result = $campaignService->listCampaigns(
        $filters,
        $pagination['page'],
        $pagination['limit'],
        $sortBy,
        $sortDir
    );

    ApiResponse::success($result, 'Campaigns retrieved successfully');
} catch (Throwable $e) {
    error_log("Campaigns List Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve campaigns.', 500);
}

