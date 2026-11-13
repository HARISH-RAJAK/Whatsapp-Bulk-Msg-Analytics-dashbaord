<?php
declare(strict_types=1);

/**
 * ClickNCult - Campaign Details API Endpoint
 * GET /api/campaigns/details.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/CampaignService.php';

ApiResponse::handleCors();
AuthMiddleware::requireAuth();

$id = trim((string)($_GET['id'] ?? ''));
if (empty($id)) {
    ApiResponse::error('Campaign identifier or request ID is required.', 422);
}

try {
    $campaignService = new CampaignService();
    $details = $campaignService->getCampaignDetails($id);

    if (!$details) {
        ApiResponse::notFound('Campaign not found.');
    }

    ApiResponse::success($details, 'Campaign details retrieved successfully');
} catch (Throwable $e) {
    error_log("Campaign Details Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve campaign details.', 500);
}

