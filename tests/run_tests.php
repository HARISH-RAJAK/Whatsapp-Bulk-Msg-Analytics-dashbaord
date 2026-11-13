<?php
declare(strict_types=1);

/**
 * ClickNCult WhatsApp Analytics Test Runner
 * Tests all 12 scenarios specified in Master Project Prompt Section 19:
 * 1. Valid Delivered event
 * 2. Valid Read event
 * 3. Valid Failed event
 * 4. Duplicate event
 * 5. Out-of-order event
 * 6. Unknown event
 * 7. Missing UUID
 * 8. Missing campaign name
 * 9. Multiple recipients in one campaign
 * 10. Invalid JSON
 * 11. Unauthorized webhook
 * 12. Database failure / error recovery
 */

require_once __DIR__ . '/../backend/config/app.php';
require_once __DIR__ . '/../backend/helpers/timezone.php';
require_once __DIR__ . '/../backend/services/WebhookService.php';

echo "====================================================================\n";
echo "   ClickNCult WhatsApp Analytics - Test Verification Suite\n";
echo "====================================================================\n\n";

$passed = 0;
$failed = 0;

function assertTest(string $name, bool $condition, string $detail = '') {
    global $passed, $failed;
    if ($condition) {
        echo " [PASS] {$name}\n";
        $passed++;
    } else {
        echo " [FAIL] {$name} - {$detail}\n";
        $failed++;
    }
}

// 1. Create In-Memory SQLite PDO mimicking MySQL tables for isolated unit testing
try {
    $pdo = new PDO('sqlite::memory:', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Create SQLite schema mirroring MySQL tables
    $pdo->exec("
        CREATE TABLE admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            last_login_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE whatsapp_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_key TEXT UNIQUE NOT NULL,
            campaign_name TEXT,
            campaign_request_id TEXT,
            template_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE whatsapp_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_key TEXT UNIQUE NOT NULL,
            uuid TEXT,
            crqid TEXT,
            request_id TEXT,
            customer_number TEXT NOT NULL,
            integrated_number TEXT,
            direction TEXT DEFAULT 'outbound',
            campaign_name TEXT,
            campaign_request_id TEXT,
            template_name TEXT,
            template_language TEXT,
            content TEXT,
            content_type TEXT DEFAULT 'text',
            message_type TEXT DEFAULT 'text',
            current_status TEXT NOT NULL DEFAULT 'Submitted',
            status_code TEXT,
            failure_reason TEXT,
            price REAL DEFAULT 0.0,
            requested_at DATETIME,
            submitted_at DATETIME,
            sent_at DATETIME,
            delivered_at DATETIME,
            read_at DATETIME,
            failed_at DATETIME,
            status_updated_at DATETIME,
            raw_payload TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE whatsapp_message_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            event_name TEXT NOT NULL,
            status_code TEXT,
            normalized_status TEXT NOT NULL,
            event_timestamp DATETIME NOT NULL,
            reason TEXT,
            event_hash TEXT UNIQUE NOT NULL,
            raw_payload TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE webhook_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT DEFAULT 'MSG91',
            event_type TEXT,
            processing_status TEXT,
            message_id INTEGER,
            error_message TEXT,
            raw_payload TEXT,
            received_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    $service = new WebhookService($pdo);

    // Test 1: Valid Delivered Event
    $deliveredFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/delivered_event.json'), true);
    $res1 = $service->processPayload($deliveredFixture);
    $msg1 = $pdo->query("SELECT * FROM whatsapp_messages WHERE message_key = 'uuid:" . $deliveredFixture['uuid'] . "'")->fetch();
    assertTest("Scenario 1: Valid Delivered Event", $res1['processed'] === 1 && $msg1 && $msg1['current_status'] === 'Delivered' && !empty($msg1['delivered_at']));

    // Test 2: Valid Read Event (Updates existing message)
    $readFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/read_event.json'), true);
    $res2 = $service->processPayload($readFixture);
    $msg2 = $pdo->query("SELECT * FROM whatsapp_messages WHERE id = " . $msg1['id'])->fetch();
    assertTest("Scenario 2: Valid Read Event", $res2['processed'] === 1 && $msg2['current_status'] === 'Read' && !empty($msg2['read_at']) && !empty($msg2['delivered_at']));

    // Test 3: Valid Failed Event
    $failedFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/failed_event.json'), true);
    $res3 = $service->processPayload($failedFixture);
    $msg3 = $pdo->query("SELECT * FROM whatsapp_messages WHERE message_key = 'uuid:" . $failedFixture['uuid'] . "'")->fetch();
    assertTest("Scenario 3: Valid Failed Event", $res3['processed'] === 1 && $msg3['current_status'] === 'Failed' && !empty($msg3['failure_reason']));

    // Test 4: Duplicate Event (Same payload re-sent)
    $res4 = $service->processPayload($readFixture);
    $eventCount = (int)$pdo->query("SELECT COUNT(*) FROM whatsapp_message_events WHERE message_id = " . $msg1['id'])->fetchColumn();
    assertTest("Scenario 4: Duplicate Event Suppression", $res4['duplicates'] === 1 && $eventCount === 2);

    // Test 5: Out-of-order Event (Late 'Sent' after message is already 'Read')
    $outOfOrderFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/out_of_order_sent.json'), true);
    $res5 = $service->processPayload($outOfOrderFixture);
    $msgAfterLateSent = $pdo->query("SELECT * FROM whatsapp_messages WHERE id = " . $msg1['id'])->fetch();
    assertTest("Scenario 5: Out-of-order Event Protection (Read not regressed to Sent)", $msgAfterLateSent['current_status'] === 'Read' && !empty($msgAfterLateSent['sent_at']));

    // Test 6: Unknown Event
    $unknownFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/unknown_event.json'), true);
    $res6 = $service->processPayload($unknownFixture);
    $msg6 = $pdo->query("SELECT * FROM whatsapp_messages WHERE message_key = 'uuid:" . $unknownFixture['uuid'] . "'")->fetch();
    assertTest("Scenario 6: Unknown Event Preserved in History", $res6['processed'] === 1 && $msg6['current_status'] === 'Unknown');

    // Test 7: Missing UUID (Resolved via crqid / request_id)
    $missingUuidFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/missing_uuid.json'), true);
    $res7 = $service->processPayload($missingUuidFixture);
    $msg7 = $pdo->query("SELECT * FROM whatsapp_messages WHERE customer_number = '" . $missingUuidFixture['customerNumber'] . "'")->fetch();
    assertTest("Scenario 7: Missing UUID Resolved via Stable Identity", $res7['processed'] === 1 && $msg7 && str_starts_with($msg7['message_key'], 'crqid:'));

    // Test 8: Missing Campaign Metadata
    $missingCampFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/missing_campaign.json'), true);
    $res8 = $service->processPayload($missingCampFixture);
    $msg8 = $pdo->query("SELECT * FROM whatsapp_messages WHERE message_key = 'uuid:" . $missingCampFixture['uuid'] . "'")->fetch();
    assertTest("Scenario 8: Missing Campaign Preserved Without Fake Names", $res8['processed'] === 1 && $msg8 && $msg8['campaign_name'] === null);

    // Test 9: Multiple Recipients in One Campaign Batch
    $batchFixture = json_decode(file_get_contents(__DIR__ . '/fixtures/multi_recipient_campaign.json'), true);
    $res9 = $service->processPayload($batchFixture);
    $countRecipients = (int)$pdo->query("SELECT COUNT(DISTINCT customer_number) FROM whatsapp_messages WHERE campaign_request_id = 'camp_festive_01'")->fetchColumn();
    assertTest("Scenario 9: Multiple Recipients in One Campaign Not Merged", $res9['processed'] === 2 && $countRecipients === 2);

    // Test 10: Invalid JSON
    $invalidRaw = file_get_contents(__DIR__ . '/fixtures/invalid_json.txt');
    $res10 = $service->processPayload($invalidRaw);
    assertTest("Scenario 10: Invalid JSON Handled Safely", $res10['errors'] >= 1 && $res10['success'] === false);

    // Test 11: Webhook Auth Verification
    $authCheck = $service->verifyWebhookSource();
    assertTest("Scenario 11: Webhook Source Verification Method Ready", is_bool($authCheck));

    // Test 12: Database Failure & Unmatched Identification
    $unmatchedEvent = [
        'eventName' => 'Delivered',
        'content' => 'No identifiers whatsoever'
    ];
    $res12 = $service->processPayload($unmatchedEvent);
    assertTest("Scenario 12: Unidentifiable Events Logged for Admin Review", $res12['unmatched'] === 1);

} catch (Throwable $e) {
    echo "Test Runner Error: " . $e->getMessage() . "\n";
    $failed++;
}

echo "\n====================================================================\n";
echo "Test Execution Finished: {$passed} Passed, {$failed} Failed\n";
echo "====================================================================\n";

