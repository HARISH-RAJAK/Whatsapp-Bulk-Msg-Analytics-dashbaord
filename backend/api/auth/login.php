<?php
declare(strict_types=1);

/**
 * ClickNCult - Admin Login API Endpoint
 * POST /api/auth/login.php
 */

require_once __DIR__ . '/../../config/app.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/csrf.php';

ApiResponse::handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method Not Allowed', 405);
}

try {
    $input = Validator::getJsonInput();
    $email = strtolower(trim($input['email'] ?? ''));
    $password = (string)($input['password'] ?? '');

    if (empty($email) || empty($password)) {
        ApiResponse::error('Email and password are required', 422);
    }

    if (!Validator::isValidEmail($email)) {
        ApiResponse::error('Invalid email address format', 422);
    }

    $pdo = Database::getConnection();
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role FROM admin_users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        // Uniform error response to prevent user enumeration
        ApiResponse::unauthorized('Invalid email or password');
    }

    // Update last_login_at
    $updateStmt = $pdo->prepare("UPDATE admin_users SET last_login_at = NOW() WHERE id = :id");
    $updateStmt->execute([':id' => $user['id']]);

    // Start session and regenerate session ID
    AuthMiddleware::login($user);

    $csrfToken = CsrfMiddleware::getToken();

    ApiResponse::success([
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ],
        'csrf_token' => $csrfToken,
    ], 'Login successful');

} catch (Throwable $e) {
    error_log("Login error: " . $e->getMessage());
    ApiResponse::error('An unexpected error occurred during login. Please try again.', 500);
}

