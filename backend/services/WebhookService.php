<?php
declare(strict_types=1);

/**
 * ClickNCult Webhook Processing Service
 * Handles MSG91 WhatsApp Delivery Reports with Deduplication, Out-of-Order Safety,
 * Multi-factor Message Identification, and Transactional Integrity.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/timezone.php';

class WebhookService
{
    private PDO $pdo;

    // Status precedence weights to prevent out-of-order regressions
    private const STATUS_WEIGHTS = [
        'Unknown' => 0,
        'Submitted' => 10,
        'Sent' => 20,
        'Delivered' => 30,
        'Read' => 40,
        'Failed' => 35, // Failed message takes precedence over Sent/Submitted, but preserves timeline if already Read
    ];

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Authenticate incoming MSG91 webhook request
     * Checks configured secret via query parameter or custom header if enabled
     */
    public function verifyWebhookSource(): bool
    {
        $config = require __DIR__ . '/../config/app.php';
        $webhookCfg = $config['webhook'];

        if (!$webhookCfg['require_auth']) {
            return true; // Not strictly enforced in dev/open mode
        }

        $expectedSecret = $webhookCfg['secret'];
        if (empty($expectedSecret)) {
            return true;
        }

        // 1. Check custom header (e.g. X-Webhook-Secret)
        $headerName = $webhookCfg['secret_header'];
        $receivedHeader = $_SERVER[$headerName] ?? '';
        if (!empty($receivedHeader) && hash_equals($expectedSecret, $receivedHeader)) {
            return true;
        }

        // 2. Check query parameter (e.g. ?token=...)
        $queryParam = $webhookCfg['token_query_param'];
        $receivedToken = $_GET[$queryParam] ?? '';
        if (!empty($receivedToken) && hash_equals($expectedSecret, $receivedToken)) {
            return true;
        }

        return false;
    }

    /**
     * Process an incoming raw webhook string or decoded array
     * Can receive a single event object or a batch array of event objects
     */
    public function processPayload(mixed $rawPayload): array
    {
        $payloadArray = is_string($rawPayload) ? json_decode($rawPayload, true) : $rawPayload;

        if (!is_array($payloadArray)) {
            $this->logWebhook(null, 'error', 'Invalid payload format: Not a JSON array or object', is_string($rawPayload) ? ['raw' => $rawPayload] : []);
            return [
                'success' => false,
                'processed' => 0,
                'duplicates' => 0,
                'unmatched' => 0,
                'errors' => 1,
                'message' => 'Invalid JSON structure'
            ];
        }

        // Normalize batch: if payload is a single associative array, wrap in array
        $isAssociative = array_keys($payloadArray) !== range(0, count($payloadArray) - 1);
        $events = $isAssociative ? [$payloadArray] : $payloadArray;

        $stats = [
            'total' => count($events),
            'processed' => 0,
            'duplicates' => 0,
            'unmatched' => 0,
            'errors' => 0,
            'details' => [],
        ];

        foreach ($events as $event) {
            if (!is_array($event)) {
                $stats['errors']++;
                continue;
            }

            try {
                $result = $this->processSingleEvent($event);
                $stats[$result['status']] = ($stats[$result['status']] ?? 0) + 1;
                $stats['details'][] = $result;
            } catch (Throwable $e) {
                error_log("ClickNCult Webhook Event Error: " . $e->getMessage());
                $this->logWebhook(null, 'error', $e->getMessage(), $event);
                $stats['errors']++;
                $stats['details'][] = [
                    'status' => 'error',
                    'message' => 'Processing failed: ' . $e->getMessage()
                ];
            }
        }

        $stats['success'] = ($stats['errors'] === 0);
        return $stats;
    }

    /**
     * Process an individual webhook event
     */
    public function processSingleEvent(array $event): array
    {
        // 1. Establish Message Identity
        $messageKey = $this->resolveMessageKey($event);

        if ($messageKey === null) {
            // Cannot reliably determine message identity
            $this->logWebhook(null, 'unmatched', 'Could not establish message identity from payload', $event);
            return [
                'status' => 'unmatched',
                'message' => 'Message identity could not be established; logged as unmatched.',
            ];
        }

        // 2. Extract Event Fields & Timestamps
        $eventName = trim((string)($event['eventName'] ?? $event['event'] ?? 'Unknown'));
        $statusCode = isset($event['statusCode']) ? (string)$event['statusCode'] : (isset($event['status']) ? (string)$event['status'] : null);
        $normalizedStatus = $this->normalizeStatus($eventName, $statusCode);
        $reason = isset($event['reason']) ? trim((string)$event['reason']) : null;

        // Determine event timestamp in UTC
        $rawEventTs = $event['statusUpdatedAt'] ?? $event['ts'] ?? $event['requestedAt'] ?? 'now';
        $eventTimestampUtc = TimezoneHelper::toUtcSql((string)$rawEventTs) ?? TimezoneHelper::nowUtc();

        // 3. Compute Unique Event Hash for Deduplication
        $eventHash = $this->computeEventHash($messageKey, $eventName, $statusCode, $eventTimestampUtc, $reason);

        // 4. Begin Database Transaction
        $this->pdo->beginTransaction();

        try {
            // Check for duplicate event hash
            $checkStmt = $this->pdo->prepare("SELECT id, message_id FROM whatsapp_message_events WHERE event_hash = :hash LIMIT 1");
            $checkStmt->execute([':hash' => $eventHash]);
            $existingEvent = $checkStmt->fetch();

            if ($existingEvent) {
                $this->pdo->commit();
                $this->logWebhook((int)$existingEvent['message_id'], 'duplicate', 'Duplicate event suppressed via event_hash', $event);
                return [
                    'status' => 'duplicates',
                    'message_id' => (int)$existingEvent['message_id'],
                    'message' => 'Duplicate event skipped',
                ];
            }

            // 5. Upsert WhatsApp Message
            $messageId = $this->upsertMessage($messageKey, $event, $normalizedStatus, $statusCode, $reason, $eventTimestampUtc);

            // 6. Record Event in Message Events Timeline
            $insertEventStmt = $this->pdo->prepare("
                INSERT INTO whatsapp_message_events (
                    message_id, event_name, status_code, normalized_status,
                    event_timestamp, reason, event_hash, raw_payload, created_at
                ) VALUES (
                    :message_id, :event_name, :status_code, :normalized_status,
                    :event_timestamp, :reason, :event_hash, :raw_payload, NOW()
                )
            ");
            $insertEventStmt->execute([
                ':message_id' => $messageId,
                ':event_name' => $eventName,
                ':status_code' => $statusCode,
                ':normalized_status' => $normalizedStatus,
                ':event_timestamp' => $eventTimestampUtc,
                ':reason' => $reason,
                ':event_hash' => $eventHash,
                ':raw_payload' => json_encode($event, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ]);

            // 7. Upsert Campaign if metadata exists
            $this->upsertCampaign($event);

            // 8. Commit Transaction & Log Success
            $this->pdo->commit();

            $this->logWebhook($messageId, 'success', null, $event);

            return [
                'status' => 'processed',
                'message_id' => $messageId,
                'normalized_status' => $normalizedStatus,
                'message' => 'Event processed successfully',
            ];
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Resolve unique message key based on priority
     * 1. uuid (e.g. wamid.sample-uuid)
     * 2. crqid (if stable message identity)
     * 3. requestId + customerNumber + integratedNumber
     */
    public function resolveMessageKey(array $event): ?string
    {
        $uuid = !empty($event['uuid']) ? trim((string)$event['uuid']) : null;
        if (!empty($uuid)) {
            return 'uuid:' . $uuid;
        }

        $crqid = !empty($event['crqid']) ? trim((string)$event['crqid']) : null;
        $customer = !empty($event['customerNumber']) ? trim((string)$event['customerNumber']) : null;

        // If crqid is present with customer number
        if (!empty($crqid) && !empty($customer)) {
            return 'crqid:' . $crqid . ':' . $customer;
        }

        $requestId = !empty($event['requestId']) ? trim((string)$event['requestId']) : null;
        $integratedNumber = !empty($event['integratedNumber']) ? trim((string)$event['integratedNumber']) : 'default';

        if (!empty($requestId) && !empty($customer)) {
            return 'req:' . $requestId . ':' . $customer . ':' . $integratedNumber;
        }

        if (!empty($crqid)) {
            return 'crqid:' . $crqid;
        }

        return null;
    }

    /**
     * Compute deterministic SHA256 event hash
     */
    public function computeEventHash(string $messageKey, string $eventName, ?string $statusCode, string $eventTimestampUtc, ?string $reason): string
    {
        $raw = implode('|', [
            $messageKey,
            strtoupper(trim($eventName)),
            (string)$statusCode,
            $eventTimestampUtc,
            trim((string)$reason)
        ]);
        return hash('sha256', $raw);
    }

    /**
     * Normalize status strings from MSG91
     */
    public function normalizeStatus(string $eventName, ?string $statusCode): string
    {
        $clean = strtolower(trim($eventName));

        // Exact name mappings
        switch ($clean) {
            case 'read':
                return 'Read';
            case 'delivered':
                return 'Delivered';
            case 'sent':
                return 'Sent';
            case 'submitted':
            case 'accepted':
            case 'queued':
                return 'Submitted';
            case 'failed':
            case 'rejected':
            case 'undelivered':
            case 'error':
                return 'Failed';
            case 'pending':
                return 'Pending';
        }

        // Check status code if known
        if ($statusCode !== null) {
            $code = trim((string)$statusCode);
            if ($code === '1' && str_contains($clean, 'deliver')) return 'Delivered';
            if ($code === '2' && str_contains($clean, 'read')) return 'Read';
            if (in_array($code, ['3', '4', '16', '17', '99'], true)) return 'Failed';
        }

        return 'Unknown';
    }

    /**
     * Upsert message record, maintaining milestones and out-of-order protection
     */
    private function upsertMessage(
        string $messageKey,
        array $event,
        string $normalizedStatus,
        ?string $statusCode,
        ?string $reason,
        string $eventTimestampUtc
    ): int {
        // Check if message already exists
        $stmt = $this->pdo->prepare("SELECT id, current_status, delivered_at, read_at, sent_at, submitted_at, failed_at, price FROM whatsapp_messages WHERE message_key = :key LIMIT 1 FOR UPDATE");
        $stmt->execute([':key' => $messageKey]);
        $existing = $stmt->fetch();

        $uuid = !empty($event['uuid']) ? trim((string)$event['uuid']) : null;
        $crqid = !empty($event['crqid']) ? trim((string)$event['crqid']) : null;
        $requestId = !empty($event['requestId']) ? trim((string)$event['requestId']) : null;
        $customer = !empty($event['customerNumber']) ? trim((string)$event['customerNumber']) : 'Unknown';
        $integrated = !empty($event['integratedNumber']) ? trim((string)$event['integratedNumber']) : null;
        $direction = !empty($event['direction']) ? trim((string)$event['direction']) : 'outbound';
        $campaignName = !empty($event['campaignName']) ? trim((string)$event['campaignName']) : null;
        $campaignReqId = !empty($event['campaignRequestId']) ? trim((string)$event['campaignRequestId']) : null;
        $templateName = !empty($event['templateName']) ? trim((string)$event['templateName']) : null;
        $templateLang = !empty($event['templateLanguage']) ? trim((string)$event['templateLanguage']) : null;
        $content = !empty($event['content']) ? (string)$event['content'] : null;
        $contentType = !empty($event['contentType']) ? trim((string)$event['contentType']) : 'text';
        $messageType = !empty($event['messageType']) ? trim((string)$event['messageType']) : 'text';
        $price = isset($event['price']) && is_numeric($event['price']) ? (float)$event['price'] : null;

        $requestedAtUtc = !empty($event['requestedAt']) ? TimezoneHelper::toUtcSql((string)$event['requestedAt']) : null;
        $rawJson = json_encode($event, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if (!$existing) {
            // New message insertion
            $sentAt = ($normalizedStatus === 'Sent') ? $eventTimestampUtc : null;
            $deliveredAt = in_array($normalizedStatus, ['Delivered', 'Read'], true) ? $eventTimestampUtc : null;
            $readAt = ($normalizedStatus === 'Read') ? $eventTimestampUtc : null;
            $failedAt = ($normalizedStatus === 'Failed') ? $eventTimestampUtc : null;
            $submittedAt = in_array($normalizedStatus, ['Submitted', 'Sent', 'Delivered', 'Read'], true) ? ($requestedAtUtc ?? $eventTimestampUtc) : null;

            $insertStmt = $this->pdo->prepare("
                INSERT INTO whatsapp_messages (
                    message_key, uuid, crqid, request_id, customer_number, integrated_number,
                    direction, campaign_name, campaign_request_id, template_name, template_language,
                    content, content_type, message_type, current_status, status_code, failure_reason,
                    price, requested_at, submitted_at, sent_at, delivered_at, read_at, failed_at,
                    status_updated_at, raw_payload, created_at, updated_at
                ) VALUES (
                    :key, :uuid, :crqid, :request_id, :customer_number, :integrated_number,
                    :direction, :campaign_name, :campaign_request_id, :template_name, :template_language,
                    :content, :content_type, :message_type, :current_status, :status_code, :failure_reason,
                    :price, :requested_at, :submitted_at, :sent_at, :delivered_at, :read_at, :failed_at,
                    :status_updated_at, :raw_payload, NOW(), NOW()
                )
            ");

            $insertStmt->execute([
                ':key' => $messageKey,
                ':uuid' => $uuid,
                ':crqid' => $crqid,
                ':request_id' => $requestId,
                ':customer_number' => $customer,
                ':integrated_number' => $integrated,
                ':direction' => $direction,
                ':campaign_name' => $campaignName,
                ':campaign_request_id' => $campaignReqId,
                ':template_name' => $templateName,
                ':template_language' => $templateLang,
                ':content' => $content,
                ':content_type' => $contentType,
                ':message_type' => $messageType,
                ':current_status' => $normalizedStatus,
                ':status_code' => $statusCode,
                ':failure_reason' => ($normalizedStatus === 'Failed') ? $reason : null,
                ':price' => $price ?? 0.0000,
                ':requested_at' => $requestedAtUtc,
                ':submitted_at' => $submittedAt,
                ':sent_at' => $sentAt,
                ':delivered_at' => $deliveredAt,
                ':read_at' => $readAt,
                ':failed_at' => $failedAt,
                ':status_updated_at' => $eventTimestampUtc,
                ':raw_payload' => $rawJson,
            ]);

            return (int)$this->pdo->lastInsertId();
        }

        // Existing message update: Respect status progression hierarchy
        $currentStatus = $existing['current_status'];
        $newWeight = self::STATUS_WEIGHTS[$normalizedStatus] ?? 0;
        $currentWeight = self::STATUS_WEIGHTS[$currentStatus] ?? 0;

        // If new status is higher in hierarchy, or if existing is Unknown/Pending, upgrade current status
        $shouldUpdateStatus = ($newWeight >= $currentWeight) || ($currentStatus === 'Unknown');

        // Note: If existing status is already Read or Delivered, an out-of-order Sent or Submitted should NOT overwrite it
        if (in_array($currentStatus, ['Delivered', 'Read'], true) && in_array($normalizedStatus, ['Submitted', 'Sent'], true)) {
            $shouldUpdateStatus = false;
        }

        // Maintain milestone timestamps (never erase previous milestone)
        $sentAt = $existing['sent_at'] ?? (($normalizedStatus === 'Sent') ? $eventTimestampUtc : null);
        $deliveredAt = $existing['delivered_at'] ?? (in_array($normalizedStatus, ['Delivered', 'Read'], true) ? $eventTimestampUtc : null);
        $readAt = $existing['read_at'] ?? (($normalizedStatus === 'Read') ? $eventTimestampUtc : null);
        $failedAt = $existing['failed_at'] ?? (($normalizedStatus === 'Failed') ? $eventTimestampUtc : null);
        $submittedAt = $existing['submitted_at'] ?? (in_array($normalizedStatus, ['Submitted', 'Sent', 'Delivered', 'Read'], true) ? ($requestedAtUtc ?? $eventTimestampUtc) : null);

        // If status is Read, and delivered_at was somehow missed, assign delivered_at = read_at
        if ($readAt !== null && $deliveredAt === null) {
            $deliveredAt = $readAt;
        }

        $finalStatus = $shouldUpdateStatus ? $normalizedStatus : $currentStatus;
        $finalFailureReason = ($normalizedStatus === 'Failed' && !empty($reason)) ? $reason : null;

        $updateStmt = $this->pdo->prepare("
            UPDATE whatsapp_messages SET
                uuid = COALESCE(:uuid, uuid),
                crqid = COALESCE(:crqid, crqid),
                request_id = COALESCE(:request_id, request_id),
                campaign_name = COALESCE(:campaign_name, campaign_name),
                campaign_request_id = COALESCE(:campaign_request_id, campaign_request_id),
                template_name = COALESCE(:template_name, template_name),
                template_language = COALESCE(:template_language, template_language),
                content = COALESCE(:content, content),
                price = CASE WHEN :price IS NOT NULL THEN :price ELSE price END,
                current_status = :final_status,
                status_code = COALESCE(:status_code, status_code),
                failure_reason = CASE WHEN :final_failure_reason IS NOT NULL THEN :final_failure_reason ELSE failure_reason END,
                submitted_at = COALESCE(submitted_at, :submitted_at),
                sent_at = COALESCE(sent_at, :sent_at),
                delivered_at = COALESCE(delivered_at, :delivered_at),
                read_at = COALESCE(read_at, :read_at),
                failed_at = COALESCE(failed_at, :failed_at),
                status_updated_at = :status_updated_at,
                raw_payload = :raw_payload,
                updated_at = NOW()
            WHERE id = :id
        ");

        $updateStmt->execute([
            ':uuid' => $uuid,
            ':crqid' => $crqid,
            ':request_id' => $requestId,
            ':campaign_name' => $campaignName,
            ':campaign_request_id' => $campaignReqId,
            ':template_name' => $templateName,
            ':template_language' => $templateLang,
            ':content' => $content,
            ':price' => $price,
            ':final_status' => $finalStatus,
            ':status_code' => $statusCode,
            ':final_failure_reason' => $finalFailureReason,
            ':submitted_at' => $submittedAt,
            ':sent_at' => $sentAt,
            ':delivered_at' => $deliveredAt,
            ':read_at' => $readAt,
            ':failed_at' => $failedAt,
            ':status_updated_at' => $eventTimestampUtc,
            ':raw_payload' => $rawJson,
            ':id' => $existing['id'],
        ]);

        return (int)$existing['id'];
    }

    /**
     * Upsert campaign record when metadata is present
     */
    private function upsertCampaign(array $event): void
    {
        $campaignName = !empty($event['campaignName']) ? trim((string)$event['campaignName']) : null;
        $campaignReqId = !empty($event['campaignRequestId']) ? trim((string)$event['campaignRequestId']) : null;
        $templateName = !empty($event['templateName']) ? trim((string)$event['templateName']) : null;

        if (empty($campaignName) && empty($campaignReqId)) {
            return; // No fake campaigns created
        }

        $campaignKey = !empty($campaignReqId) ? 'req:' . $campaignReqId : 'name:' . $campaignName;

        $stmt = $this->pdo->prepare("
            INSERT INTO whatsapp_campaigns (campaign_key, campaign_name, campaign_request_id, template_name, created_at, updated_at)
            VALUES (:key, :name, :rqid, :template, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                campaign_name = COALESCE(VALUES(campaign_name), campaign_name),
                campaign_request_id = COALESCE(VALUES(campaign_request_id), campaign_request_id),
                template_name = COALESCE(VALUES(template_name), template_name),
                updated_at = NOW()
        ");

        $stmt->execute([
            ':key' => $campaignKey,
            ':name' => $campaignName,
            ':rqid' => $campaignReqId,
            ':template' => $templateName,
        ]);
    }

    /**
     * Log webhook arrival and processing outcome
     */
    public function logWebhook(?int $messageId, string $status, ?string $errorMessage, array $payload): void
    {
        try {
            $eventType = $payload['eventName'] ?? ($payload['event'] ?? 'unknown');
            $stmt = $this->pdo->prepare("
                INSERT INTO webhook_logs (source, event_type, processing_status, message_id, error_message, raw_payload, received_at)
                VALUES ('MSG91', :event_type, :status, :message_id, :error, :payload, NOW())
            ");
            $stmt->execute([
                ':event_type' => $eventType,
                ':status' => $status,
                ':message_id' => $messageId,
                ':error' => $errorMessage,
                ':payload' => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ]);
        } catch (Throwable $e) {
            error_log("Failed to insert webhook log: " . $e->getMessage());
        }
    }
}

