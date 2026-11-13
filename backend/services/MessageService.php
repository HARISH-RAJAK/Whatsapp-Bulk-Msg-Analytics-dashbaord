<?php
declare(strict_types=1);

/**
 * ClickNCult Message Management & Retrieval Service
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/timezone.php';
require_once __DIR__ . '/../helpers/validation.php';

class MessageService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * List messages with search, multi-faceted filtering, sorting, and pagination
     */
    public function listMessages(array $filters, int $page = 1, int $limit = 25, string $sortBy = 'created_at', string $sortDir = 'DESC'): array
    {
        $allowedSort = [
            'id', 'created_at', 'requested_at', 'delivered_at', 'read_at',
            'customer_number', 'current_status', 'price', 'campaign_name', 'template_name'
        ];
        $sortColumn = Validator::sanitizeSortColumn($sortBy, $allowedSort, 'created_at');
        $sortDirection = Validator::sanitizeSortDirection($sortDir, 'DESC');

        $where = ['1=1'];
        $params = [];

        // Search: customer number, UUID, request ID, crqid
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $where[] = "(
                customer_number LIKE :search
                OR uuid LIKE :search
                OR request_id LIKE :search
                OR crqid LIKE :search
                OR campaign_name LIKE :search
                OR template_name LIKE :search
            )";
            $params[':search'] = $search;
        }

        // Status Filter
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $where[] = "current_status = :status";
            $params[':status'] = $filters['status'];
        }

        // Campaign Filter
        if (!empty($filters['campaign'])) {
            $where[] = "(campaign_name = :campaign OR campaign_request_id = :campaign)";
            $params[':campaign'] = $filters['campaign'];
        }

        // Template Filter
        if (!empty($filters['template'])) {
            $where[] = "template_name = :template";
            $params[':template'] = $filters['template'];
        }

        // Customer Number Filter
        if (!empty($filters['customer_number'])) {
            $where[] = "customer_number = :cust_no";
            $params[':cust_no'] = $filters['customer_number'];
        }

        // Date Range Filter (based on created_at or requested_at)
        $dateField = !empty($filters['date_field']) && in_array($filters['date_field'], ['requested_at', 'delivered_at'], true)
            ? $filters['date_field']
            : 'created_at';

        if (!empty($filters['start_date'])) {
            $where[] = "{$dateField} >= :start_date";
            $params[':start_date'] = $filters['start_date'];
        }
        if (!empty($filters['end_date'])) {
            $where[] = "{$dateField} <= :end_date";
            $params[':end_date'] = $filters['end_date'];
        }

        $whereClause = implode(' AND ', $where);

        // Count total
        $countStmt = $this->pdo->prepare("SELECT COUNT(*) as total FROM whatsapp_messages WHERE {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Fetch records
        $offset = ($page - 1) * $limit;
        $sql = "
            SELECT 
                id, message_key, uuid, crqid, request_id, customer_number, integrated_number,
                direction, campaign_name, campaign_request_id, template_name, template_language,
                content, content_type, message_type, current_status, status_code, failure_reason,
                price, requested_at, submitted_at, sent_at, delivered_at, read_at, failed_at,
                status_updated_at, created_at, updated_at
            FROM whatsapp_messages
            WHERE {$whereClause}
            ORDER BY {$sortColumn} {$sortDirection}
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

        // Convert UTC timestamps to Asia/Kolkata display time
        $formatted = array_map(function ($row) {
            return $this->formatMessageRow($row);
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
     * Get detailed message record including event audit history
     */
    public function getMessageDetails(int $id): ?array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM whatsapp_messages WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $message = $stmt->fetch();

        if (!$message) {
            return null;
        }

        // Fetch all webhook events for this message
        $eventStmt = $this->pdo->prepare("
            SELECT id, message_id, event_name, status_code, normalized_status,
                   event_timestamp, reason, event_hash, raw_payload, created_at
            FROM whatsapp_message_events
            WHERE message_id = :id
            ORDER BY event_timestamp ASC, id ASC
        ");
        $eventStmt->execute([':id' => $id]);
        $events = $eventStmt->fetchAll();

        $formattedEvents = array_map(function ($ev) {
            return [
                'id' => (int)$ev['id'],
                'event_name' => $ev['event_name'],
                'status_code' => $ev['status_code'],
                'normalized_status' => $ev['normalized_status'],
                'reason' => $ev['reason'],
                'event_hash' => $ev['event_hash'],
                'event_timestamp' => TimezoneHelper::toDisplayTz($ev['event_timestamp']),
                'created_at' => TimezoneHelper::toDisplayTz($ev['created_at']),
                'raw_payload' => !empty($ev['raw_payload']) ? json_decode($ev['raw_payload'], true) : null,
            ];
        }, $events);

        $formatted = $this->formatMessageRow($message, true);
        $formatted['events'] = $formattedEvents;

        return $formatted;
    }

    /**
     * Customer message summary (grouped by customer_number)
     */
    public function listCustomers(array $filters, int $page = 1, int $limit = 25): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['search'])) {
            $where[] = "customer_number LIKE :search";
            $params[':search'] = '%' . trim($filters['search']) . '%';
        }

        $whereClause = implode(' AND ', $where);

        $countStmt = $this->pdo->prepare("
            SELECT COUNT(DISTINCT customer_number) as total 
            FROM whatsapp_messages 
            WHERE {$whereClause}
        ");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $offset = ($page - 1) * $limit;
        $sql = "
            SELECT 
                customer_number,
                COUNT(*) as total_messages,
                SUM(CASE WHEN current_status = 'Delivered' OR delivered_at IS NOT NULL THEN 1 ELSE 0 END) as delivered_count,
                SUM(CASE WHEN current_status = 'Read' OR read_at IS NOT NULL THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN current_status = 'Failed' OR failed_at IS NOT NULL THEN 1 ELSE 0 END) as failed_count,
                MAX(COALESCE(requested_at, created_at)) as last_activity,
                SUM(price) as total_spent
            FROM whatsapp_messages
            WHERE {$whereClause}
            GROUP BY customer_number
            ORDER BY last_activity DESC
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
            $delivered = (int)$row['delivered_count'];
            $read = (int)$row['read_count'];
            return [
                'customer_number' => $row['customer_number'],
                'total_messages' => $total,
                'delivered_count' => $delivered,
                'read_count' => $read,
                'failed_count' => (int)$row['failed_count'],
                'delivery_rate' => $total > 0 ? round(($delivered / $total) * 100, 2) : 0,
                'read_rate' => $delivered > 0 ? round(($read / $delivered) * 100, 2) : 0,
                'last_activity' => TimezoneHelper::toDisplayTz($row['last_activity']),
                'total_spent' => (float)$row['total_spent'],
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
     * Format a raw database row with Asia/Kolkata timestamps
     */
    private function formatMessageRow(array $row, bool $includeRaw = false): array
    {
        $res = [
            'id' => (int)$row['id'],
            'message_key' => $row['message_key'],
            'uuid' => $row['uuid'],
            'crqid' => $row['crqid'],
            'request_id' => $row['request_id'],
            'customer_number' => $row['customer_number'],
            'integrated_number' => $row['integrated_number'],
            'direction' => $row['direction'],
            'campaign_name' => $row['campaign_name'],
            'campaign_request_id' => $row['campaign_request_id'],
            'template_name' => $row['template_name'],
            'template_language' => $row['template_language'],
            'content' => $row['content'],
            'content_type' => $row['content_type'],
            'message_type' => $row['message_type'],
            'current_status' => $row['current_status'],
            'status_code' => $row['status_code'],
            'failure_reason' => $row['failure_reason'],
            'price' => (float)$row['price'],
            'requested_at' => TimezoneHelper::toDisplayTz($row['requested_at']),
            'submitted_at' => TimezoneHelper::toDisplayTz($row['submitted_at']),
            'sent_at' => TimezoneHelper::toDisplayTz($row['sent_at']),
            'delivered_at' => TimezoneHelper::toDisplayTz($row['delivered_at']),
            'read_at' => TimezoneHelper::toDisplayTz($row['read_at']),
            'failed_at' => TimezoneHelper::toDisplayTz($row['failed_at']),
            'status_updated_at' => TimezoneHelper::toDisplayTz($row['status_updated_at']),
            'created_at' => TimezoneHelper::toDisplayTz($row['created_at']),
        ];

        if ($includeRaw && !empty($row['raw_payload'])) {
            $res['raw_payload'] = is_string($row['raw_payload']) ? json_decode($row['raw_payload'], true) : $row['raw_payload'];
        }

        return $res;
    }
}

