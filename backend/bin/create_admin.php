<?php
declare(strict_types=1);

/**
 * ClickNCult - CLI Admin Account Creation & Password Reset Utility
 * Usage:
 *   php create_admin.php "Admin Name" "admin@clickncult.com" "SecurePassword123!"
 */

if (php_sapi_name() !== 'cli') {
    die("This script can only be run from the command line.\n");
}

require_once __DIR__ . '/../config/database.php';

$name = $argv[1] ?? 'ClickNCult Administrator';
$email = strtolower(trim($argv[2] ?? 'admin@clickncult.com'));
$password = $argv[3] ?? 'Admin@ClickNCult2026!';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Error: Invalid email format: {$email}\n");
}

if (strlen($password) < 8) {
    die("Error: Password must be at least 8 characters long.\n");
}

$hash = password_hash($password, PASSWORD_BCRYPT);

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare("
        INSERT INTO admin_users (name, email, password_hash, role, created_at, updated_at)
        VALUES (:name, :email, :hash, 'admin', NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            password_hash = VALUES(password_hash),
            updated_at = NOW()
    ");

    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':hash' => $hash,
    ]);

    echo "=========================================================\n";
    echo "ClickNCult Admin User Initialized Successfully!\n";
    echo "Name:     {$name}\n";
    echo "Email:    {$email}\n";
    echo "Role:     admin\n";
    echo "=========================================================\n";
} catch (Throwable $e) {
    echo "Error: Failed to create admin user: " . $e->getMessage() . "\n";
    exit(1);
}

