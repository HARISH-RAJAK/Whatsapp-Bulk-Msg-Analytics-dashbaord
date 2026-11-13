<?php
declare(strict_types=1);

/**
 * ClickNCult WhatsApp Analytics Service
 * Strict unique-message counting, milestone accumulation, rate computations,
 * and time-series aggregation in Asia/Kolkata timezone.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/timezone.php';

class AnalyticsService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Compute KPI cards summary for a given date range
     */
    public function getSummary(array $dateFilter): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($dateFilter['start_utc'])) {
            $where[] = "created_at >= :start_date";
            $params[':start_date'] = $dateFilter['start_utc'];
        }
        if (!empty($dateFilter['end_utc'])) {
            $where[] = "created_at <= :end_date";
            $params[':end_date'] = $dateFilter['end_utc'];
        }

        $whereClause = implode(' AND ', $where);

        $sql = "
            SELECT
                COUNT(*) as total_messages,
                SUM(CASE WHEN submitted_at IS NOT NULL OR current_status IN ('Submitted', 'Sent', 'Delivered', 'Read') THEN 1 ELSE 0 END) as submitted_count,
                SUM(CASE WHEN sent_at IS NOT NULL OR current_status IN ('Sent', 'Delivered', 'Read') THEN 1 ELSE 0 END) as sent_count,
                SUM(CASE WHEN delivered_at IS NOT NULL OR current_status IN ('Delivered', 'Read') THEN 1 ELSE 0 END) as delivered_count,
                SUM(CASE WHEN read_at IS NOT NULL OR current_status = 'Read' THEN 1 ELSE 0 END) as read_count,
                SUM(CASE WHEN failed_at IS NOT NULL OR current_status = 'Failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN current_status IN ('Submitted', 'Pending') THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN current_status = 'Unknown' THEN 1 ELSE 0 END) as unknown_count,
                SUM(price) as total_cost
            FROM whatsapp_messages
            WHERE {$whereClause}
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch() ?: [];

        $total = (int)($row['total_messages'] ?? 0);
        $submitted = (int)($row['submitted_count'] ?? 0);
        $sent = (int)($row['sent_count'] ?? 0);
        $delivered = (int)($row['delivered_count'] ?? 0);
        $read = (int)($row['read_count'] ?? 0);
        $failed = (int)($row['failed_count'] ?? 0);
        $pending = (int)($row['pending_count'] ?? 0);
        $unknown = (int)($row['unknown_count'] ?? 0);
        $totalCost = (float)($row['total_cost'] ?? 0);

        // Denominator rules:
        // Eligible submitted messages = total confirmed messages submitted to provider
        $eligibleSubmitted = $submitted > 0 ? $submitted : $total;

        $deliveryRate = $eligibleSubmitted > 0 ? round(($delivered / $eligibleSubmitted) * 100, 2) : 0.0;
        $readRate = $delivered > 0 ? round(($read / $delivered) * 100, 2) : 0.0;
        $failureRate = $eligibleSubmitted > 0 ? round(($failed / $eligibleSubmitted) * 100, 2) : 0.0;

        // Current status distribution (exclusive breakdown)
        $statusStmt = $this->pdo->prepare("
            SELECT current_status, COUNT(*) as count
            FROM whatsapp_messages
            WHERE {$whereClause}
            GROUP BY current_status
        ");
        $statusStmt->execute($params);
        $statusBreakdown = $statusStmt->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];

        return [
            'kpis' => [
                'total_messages' => $total,
                'submitted' => $submitted,
                'sent' => $sent,
                'delivered' => $delivered,
                'read' => $read,
                'failed' => $failed,
                'pending' => $pending,
                'unknown' => $unknown,
                'delivery_rate' => $deliveryRate,
                'read_rate' => $readRate,
                'failure_rate' => $failureRate,
                'total_cost' => $totalCost,
            ],
            'status_breakdown' => $statusBreakdown,
            'metadata' => [
                'timezone' => TimezoneHelper::DISPLAY_TZ,
                'preset' => $dateFilter['preset'] ?? 'last_30_days',
                'start_utc' => $dateFilter['start_utc'] ?? null,
                'end_utc' => $dateFilter['end_utc'] ?? null,
                'source_notice' => 'Analytics are based on MSG91 webhook delivery reports received by ClickNCult.',
            ],
        ];
    }

    /**
     * Daily message trend aggregated by date in Asia/Kolkata
     */
    public function getDailyTrends(array $dateFilter): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($dateFilter['start_utc'])) {
            $where[] = "created_at >= :start_date";
            $params[':start_date'] = $dateFilter['start_utc'];
        }
        if (!empty($dateFilter['end_utc'])) {
            $where[] = "created_at <= :end_date";
            $params[':end_date'] = $dateFilter['end_utc'];
        }

        $whereClause = implode(' AND ', $where);

        // Convert UTC created_at to Asia/Kolkata (+05:30) for daily grouping
        $sql = "
            SELECT 
                DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) as day_date,
                COUNT(*) as total,
                SUM(CASE WHEN sent_at IS NOT NULL OR current_status IN ('Sent', 'Delivered', 'Read') THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN delivered_at IS NOT NULL OR current_status IN ('Delivered', 'Read') THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN read_at IS NOT NULL OR current_status = 'Read' THEN 1 ELSE 0 END) as `read`,
                SUM(CASE WHEN failed_at IS NOT NULL OR current_status = 'Failed' THEN 1 ELSE 0 END) as failed
            FROM whatsapp_messages
            WHERE {$whereClause}
            GROUP BY day_date
            ORDER BY day_date ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            $del = (int)$row['delivered'];
            $rd = (int)$row['read'];
            $tot = (int)$row['total'];
            return [
                'date' => $row['day_date'],
                'total' => $tot,
                'sent' => (int)$row['sent'],
                'delivered' => $del,
                'read' => $rd,
                'failed' => (int)$row['failed'],
                'delivery_rate' => $tot > 0 ? round(($del / $tot) * 100, 1) : 0,
                'read_rate' => $del > 0 ? round(($rd / $del) * 100, 1) : 0,
            ];
        }, $rows);
    }

    /**
     * Hourly message distribution (0-23) in Asia/Kolkata
     */
    public function getHourlyDistribution(array $dateFilter): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($dateFilter['start_utc'])) {
            $where[] = "created_at >= :start_date";
            $params[':start_date'] = $dateFilter['start_utc'];
        }
        if (!empty($dateFilter['end_utc'])) {
            $where[] = "created_at <= :end_date";
            $params[':end_date'] = $dateFilter['end_utc'];
        }

        $whereClause = implode(' AND ', $where);

        $sql = "
            SELECT 
                HOUR(CONVERT_TZ(created_at, '+00:00', '+05:30')) as hour_of_day,
                COUNT(*) as total,
                SUM(CASE WHEN delivered_at IS NOT NULL OR current_status IN ('Delivered', 'Read') THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN failed_at IS NOT NULL OR current_status = 'Failed' THEN 1 ELSE 0 END) as failed
            FROM whatsapp_messages
            WHERE {$whereClause}
            GROUP BY hour_of_day
            ORDER BY hour_of_day ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Index by hour 0 to 23
        $hourMap = [];
        foreach ($rows as $r) {
            $hourMap[(int)$r['hour_of_day']] = $r;
        }

        $full24Hours = [];
        for ($h = 0; $h < 24; $h++) {
            $label = sprintf('%02d:00', $h);
            $r = $hourMap[$h] ?? null;
            $full24Hours[] = [
                'hour' => $label,
                'hour_num' => $h,
                'total' => $r ? (int)$r['total'] : 0,
                'delivered' => $r ? (int)$r['delivered'] : 0,
                'failed' => $r ? (int)$r['failed'] : 0,
            ];
        }

        return $full24Hours;
    }

    /**
     * Template performance analytics
     */
    public function getTemplateAnalytics(array $dateFilter, int $limit = 20): array
    {
        $where = ['template_name IS NOT NULL', "template_name != ''"];
        $params = [];

        if (!empty($dateFilter['start_utc'])) {
            $where[] = "created_at >= :start_date";
            $params[':start_date'] = $dateFilter['start_utc'];
        }
        if (!empty($dateFilter['end_utc'])) {
            $where[] = "created_at <= :end_date";
            $params[':end_date'] = $dateFilter['end_utc'];
        }

        $whereClause = implode(' AND ', $where);

        $sql = "
            SELECT 
                template_name,
                COUNT(*) as total_messages,
                SUM(CASE WHEN delivered_at IS NOT NULL OR current_status IN ('Delivered', 'Read') THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN read_at IS NOT NULL OR current_status = 'Read' THEN 1 ELSE 0 END) as `read`,
                SUM(CASE WHEN failed_at IS NOT NULL OR current_status = 'Failed' THEN 1 ELSE 0 END) as failed,
                SUM(price) as total_cost
            FROM whatsapp_messages
            WHERE {$whereClause}
            GROUP BY template_name
            ORDER BY total_messages DESC
            LIMIT :limit
        ";

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            $total = (int)$row['total_messages'];
            $del = (int)$row['delivered'];
            $rd = (int)$row['read'];
            $fail = (int)$row['failed'];

            return [
                'template_name' => $row['template_name'],
                'total_messages' => $total,
                'delivered' => $del,
                'read' => $rd,
                'failed' => $fail,
                'delivery_rate' => $total > 0 ? round(($del / $total) * 100, 2) : 0,
                'read_rate' => $del > 0 ? round(($rd / $del) * 100, 2) : 0,
                'failure_rate' => $total > 0 ? round(($fail / $total) * 100, 2) : 0,
                'total_cost' => (float)$row['total_cost'],
            ];
        }, $rows);
    }

    /**
     * Failure reason distribution and breakdown
     */
    public function getFailureReports(array $dateFilter, int $limit = 50): array
    {
        $where = ["(current_status = 'Failed' OR failed_at IS NOT NULL)"];
        $params = [];

        if (!empty($dateFilter['start_utc'])) {
            $where[] = "created_at >= :start_date";
            $params[':start_date'] = $dateFilter['start_utc'];
        }
        if (!empty($dateFilter['end_utc'])) {
            $where[] = "created_at <= :end_date";
            $params[':end_date'] = $dateFilter['end_utc'];
        }

        $whereClause = implode(' AND ', $where);

        $sql = "
            SELECT 
                COALESCE(failure_reason, 'Unspecified Error') as reason,
                status_code,
                COUNT(*) as count
            FROM whatsapp_messages
            WHERE {$whereClause}
            GROUP BY reason, status_code
            ORDER BY count DESC
            LIMIT :limit
        ";

        $stmt = $this->pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}

