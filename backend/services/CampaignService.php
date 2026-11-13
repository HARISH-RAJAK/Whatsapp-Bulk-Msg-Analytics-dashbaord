<?php
declare(strict_types=1);

/**
 * ClickNCult Campaign Analytics & Aggregation Service
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/timezone.php';
require_once __DIR__ . '/../helpers/validation.php';

class CampaignService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * List campaigns aggregated with actual unique message metrics
     */
    public function listCampaigns(array $filters, int $page = 1, int $limit = 25, string $sortBy = 'total_messages', string $sortDir = 'DESC'): array
    {
        $where = ["(m.campaign_name IS NOT NULL OR m.campaign_request_id IS NOT NULL)"];
        $params = [];

        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $where[] = "(m.campaign_name LIKE :search OR m.campaign_request_id LIKE :search OR m.template_name LIKE :search)";
            $params[':search'] = $search;
        }

        if (!empty($filters['start_date'])) {
            $where[] = "m.created_at >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }
        if (!empty($filters['end_date'])) {
            $where[] = "m.created_at <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        $whereClause = implode(' AND ', $where);

        // Sorting mapping
        $allowedSort = [
            'campaign_name' => 'camp_name',
            'campaign_request_id' => 'camp_rqid',
            'total_messages' => 'total_messages',
            'delivered' => 'delivered_count',
            'read' => 'read_count',
            'failed' => 'failed_count',
            'delivery_rate' => 'delivery_rate',
            'created_at' => 'latest_date',
        ];
        $sortCol = $allowedSort[$sortBy] ?? 'total_messages';
        $sortDirection = Validator::sanitizeSortDirection($sortDir, 'DESC');

        // Count distinct campaigns
        $countSql = "
            SELECT COUNT(DISTINCT COALESCE(NULLIF(m.campaign_request_id, ''), m.campaign_name))
            FROM whatsapp_messages m
            WHERE {$whereClause}
        ";
        $countStmt = $this->pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $offset = ($page - 1) * $limit;

        $sql = "
            SELECT 
                COALESCE(NULLIF(m.campaign_request_id, ''), m.campaign_name) as campaign_identifier,
                MAX(m.campaign_name) as camp_name,
                MAX(m.campaign_request_id) as camp_rqid,
                MAX(m.template_name) as template_name,
                COUNT(*) as total_messages,
                SUM(CASE WHEN m.submitted_at IS NOT NULL OR m.current_status IN ('Submitted', 'Sent', 'Delivered', 'Read') THEN 1 ELSE 0 END) as submitted_count,
                SUM(CASE WHEN m.sent_at IS NOT NULL OR m.current_status IN ('Sent', 'Delivered', 'Read') THEN 1 ELSE 0 END) as sent_count,
                SUM(CASE WHEN m.delivered_at IS NOT NULL OR m.current_status IN ('Delivered', 'Read') THEN 1 ELSE 0 END) as delivered_count,
                SUM(CASE WHEN m.read_at IS NOT NULL OR m.current_status = 'Read' THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN m.failed_at IS NOT NULL OR m.current_status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(m.price) as total_cost,
                MIN(m.created_at) as earliest_date,
                MAX(m.created_at) as latest_date,
                ROUND((SUM(CASE WHEN m.delivered_at IS NOT NULL OR m.current_status IN ('Delivered', 'Read') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as delivery_rate
            FROM whatsapp_messages m
            WHERE {$whereClause}
            GROUP BY campaign_identifier
            ORDER BY {$sortCol} {$sortDirection}
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();

        $formatted = array_map(function ($row) {
            $total = (int)$row['total_messages'];
            $del = (int)$row['delivered_count'];
            $read = (int)$row['read_count'];
            $fail = (int)$row['failed_count'];
            $sub = (int)$row['submitted_count'];

            return [
                'campaign_identifier' => $row['campaign_identifier'],
                'campaign_name' => $row['camp_name'] ?: 'Unnamed Campaign',
                'campaign_request_id' => $row['camp_rqid'] ?: '-',
                'template_name' => $row['template_name'] ?: '-',
                'total_messages' => $total,
                'submitted' => $sub,
                'sent' => (int)$row['sent_count'],
                'delivered' => $del,
                'read' => $read,
                'failed' => $fail,
                'delivery_rate' => $total > 0 ? round(($del / $total) * 100, 2) : 0,
                'read_rate' => $del > 0 ? round(($read / $del) * 100, 2) : 0,
                'failure_rate' => $total > 0 ? round(($fail / $total) * 100, 2) : 0,
                'total_cost' => (float)$row['total_cost'],
                'campaign_date' => TimezoneHelper::toDisplayTz($row['earliest_date']),
                'last_activity' => TimezoneHelper::toDisplayTz($row['latest_date']),
            ];
        }, $rows);

        return [
            'items' => $formatted,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => (int)ceil($total / max(1, $limit)),
            ]
        ];
    }

    /**
     * Get campaign performance details and its message list
     */
    public function getCampaignDetails(string $identifier): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                MAX(m.campaign_name) as campaign_name,
                MAX(m.campaign_request_id) as campaign_request_id,
                MAX(m.template_name) as template_name,
                COUNT(*) as total_messages,
                SUM(CASE WHEN m.submitted_at IS NOT NULL OR m.current_status IN ('Submitted', 'Sent', 'Delivered', 'Read') THEN 1 ELSE 0 END) as submitted_count,
                SUM(CASE WHEN m.sent_at IS NOT NULL OR m.current_status IN ('Sent', 'Delivered', 'Read') THEN 1 ELSE 0 END) as sent_count,
                SUM(CASE WHEN m.delivered_at IS NOT NULL OR m.current_status IN ('Delivered', 'Read') THEN 1 ELSE 0 END) as delivered_count,
                SUM(CASE WHEN m.read_at IS NOT NULL OR m.current_status = 'Read' THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN m.failed_at IS NOT NULL OR m.current_status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(m.price) as total_cost,
                MIN(m.created_at) as earliest_date,
                MAX(m.created_at) as latest_date
            FROM whatsapp_messages m
            WHERE m.campaign_request_id = :id OR m.campaign_name = :id
        ");
        $stmt->execute([':id' => $identifier]);
        $row = $stmt->fetch();

        if (!$row || empty($row['total_messages'])) {
            return null;
        }

        $total = (int)$row['total_messages'];
        $del = (int)$row['delivered_count'];
        $read = (int)$row['read_count'];
        $fail = (int)$row['failed_count'];

        // Get status distribution for this campaign
        $statusStmt = $this->pdo->prepare("
            SELECT current_status, COUNT(*) as count
            FROM whatsapp_messages
            WHERE campaign_request_id = :id OR campaign_name = :id
            GROUP BY current_status
        ");
        $statusStmt->execute([':id' => $identifier]);
        $statusBreakdown = $statusStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        return [
            'campaign_identifier' => $identifier,
            'campaign_name' => $row['campaign_name'] ?: 'Unnamed Campaign',
            'campaign_request_id' => $row['campaign_request_id'] ?: '-',
            'template_name' => $row['template_name'] ?: '-',
            'total_messages' => $total,
            'submitted' => (int)$row['submitted_count'],
            'sent' => (int)$row['sent_count'],
            'delivered' => $del,
            'read' => $read,
            'failed' => $fail,
            'delivery_rate' => $total > 0 ? round(($del / $total) * 100, 2) : 0,
            'read_rate' => $del > 0 ? round(($read / $del) * 100, 2) : 0,
            'failure_rate' => $total > 0 ? round(($fail / $total) * 100, 2) : 0,
            'total_cost' => (float)$row['total_cost'],
            'campaign_date' => TimezoneHelper::toDisplayTz($row['earliest_date']),
            'last_activity' => TimezoneHelper::toDisplayTz($row['latest_date']),
            'status_breakdown' => $statusBreakdown,
        ];
    }
}

