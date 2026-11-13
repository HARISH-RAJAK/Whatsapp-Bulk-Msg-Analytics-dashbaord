<?php
declare(strict_types=1);

/**
 * ClickNCult - Settings API Endpoint
 * GET /api/settings/index.php (view settings and system health)
 * POST /api/settings/index.php (update admin profile)
 */

require_once __DIR__ . '/../../config/app.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/timezone.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/csrf.php';

ApiResponse::handleCors();
$currentUser = AuthMiddleware::requireAuth();
$config = require __DIR__ . '/../../config/app.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    CsrfMiddleware::validate();

    $input = Validator::getJsonInput();
    $name = trim($input['name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));
    $currentPassword = (string)($input['current_password'] ?? '');
    $newPassword = (string)($input['new_password'] ?? '');

    if (empty($name) || empty($email)) {
        ApiResponse::error('Name and email are required.', 422);
    }

    if (!Validator::isValidEmail($email)) {
        ApiResponse::error('Invalid email address.', 422);
    }

    try {
        $pdo = Database::getConnection();

        // If changing password, verify current password
        if (!empty($newPassword)) {
            if (empty($currentPassword)) {
                ApiResponse::error('Current password is required to change password.', 422);
            }
            if (strlen($newPassword) < 8) {
                ApiResponse::error('New password must be at least 8 characters long.', 422);
            }

            $stmt = $pdo->prepare("SELECT password_hash FROM admin_users WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $currentUser['id']]);
            $hash = $stmt->fetchColumn();

            if (!$hash || !password_verify($currentPassword, $hash)) {
                ApiResponse::error('Current password verification failed.', 401);
            }

            $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $updateStmt = $pdo->prepare("
                UPDATE admin_users 
                SET name = :name, email = :email, password_hash = :hash, updated_at = NOW() 
                WHERE id = :id
            ");
            $updateStmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':hash' => $newHash,
                ':id' => $currentUser['id'],
            ]);
        } else {
            $updateStmt = $pdo->prepare("
                UPDATE admin_users 
                SET name = :name, email = :email, updated_at = NOW() 
                WHERE id = :id
            ");
            $updateStmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':id' => $currentUser['id'],
            ]);
        }

        // Refresh session
        $currentUser['name'] = $name;
        $currentUser['email'] = $email;
        $_SESSION['admin_user'] = $currentUser;

        ApiResponse::success(['user' => $currentUser], 'Profile updated successfully.');
    } catch (Throwable $e) {
        error_log("Settings Update Error: " . $e->getMessage());
        ApiResponse::error('Failed to update profile.', 500);
    }
}

// GET Settings & System Health
try {
    $pdo = Database::getConnection();

    // Check last received webhook
    $lastWebhookStmt = $pdo->query("SELECT received_at, processing_status FROM webhook_logs ORDER BY id DESC LIMIT 1");
    $lastWebhook = $lastWebhookStmt->fetch();

    // Total webhook count
    $countStmt = $pdo->query("SELECT COUNT(*) FROM webhook_logs");
    $webhookCount = (int)$countStmt->fetchColumn();

    $lastWebhookFormatted = $lastWebhook
        ? TimezoneHelper::toDisplayTz($lastWebhook['received_at']) . " (" . $lastWebhook['processing_status'] . ")"
        : 'No webhooks received yet';

    $webhookEndpoint = rtrim($config['base_url'], '/') . '/backend/webhooks/msg91-whatsapp.php';

    $data = [
        'company_name' => $config['company_name'],
        'app_name' => $config['app_name'],
        'integration' => 'MSG91',
        'service' => 'WhatsApp',
        'webhook_status' => 'Active',
        'webhook_endpoint' => $webhookEndpoint,
        'webhook_secret_enforced' => !empty($config['webhook']['require_auth']),
        'total_webhooks_logged' => $webhookCount,
        'last_webhook_received' => $lastWebhookFormatted,
        'database_status' => 'Connected (MySQL 8+ PDO)',
        'timezone' => $config['display_timezone'],
        'storage_timezone' => $config['storage_timezone'],
        'admin_profile' => [
            'id' => $currentUser['id'],
            'name' => $currentUser['name'],
            'email' => $currentUser['email'],
            'role' => $currentUser['role'],
        ],
    ];

    ApiResponse::success($data, 'Settings retrieved successfully.');
} catch (Throwable $e) {
    error_log("Settings Error: " . $e->getMessage());
    ApiResponse::error('Failed to retrieve system settings.', 500);
}

