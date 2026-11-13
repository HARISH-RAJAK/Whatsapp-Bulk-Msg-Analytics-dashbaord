<?php
declare(strict_types=1);

/**
 * ClickNCult - Messages CSV Export API Endpoint
 * GET /api/export/messages.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/timezone.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../services/MessageService.php';

AuthMiddleware::requireAuth();

try {
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
    // Export up to 10,000 records for safety
    $result = $messageService->listMessages($filters, 1, 10000, 'created_at', 'DESC');
    $messages = $result['items'] ?? [];

    $filename = 'clickncult_messages_' . date('Ymd_His') . '.csv';

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
    // Write UTF-8 BOM for Excel compatibility
    fputs($output, "\xEF\xBB\xBF");

    // CSV Headers
    fputcsv($output, [
        'Message ID',
        'Customer Number',
        'UUID',
        'Request ID',
        'Campaign Name',
        'Campaign Request ID',
        'Template Name',
        'Current Status',
        'Status Code',
        'Price',
        'Requested Time (IST)',
        'Delivered Time (IST)',
        'Read Time (IST)',
        'Failed Time (IST)',
        'Failure Reason',
        'Created Time (IST)',
    ]);

    foreach ($messages as $m) {
        fputcsv($output, [
            $m['id'],
            $m['customer_number'],
            $m['uuid'],
            $m['request_id'],
            $m['campaign_name'],
            $m['campaign_request_id'],
            $m['template_name'],
            $m['current_status'],
            $m['status_code'],
            $m['price'],
            $m['requested_at'],
            $m['delivered_at'],
            $m['read_at'],
            $m['failed_at'],
            $m['failure_reason'],
            $m['created_at'],
        ]);
    }

    fclose($output);
    exit();
} catch (Throwable $e) {
    error_log("Export Error: " . $e->getMessage());
    ApiResponse::error('Failed to export CSV report: ' . $e->getMessage(), 500);
}

