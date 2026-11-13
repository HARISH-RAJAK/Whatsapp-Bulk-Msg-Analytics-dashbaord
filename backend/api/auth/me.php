<?php
declare(strict_types=1);

/**
 * ClickNCult - Authenticated User Profile API Endpoint
 * GET /api/auth/me.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/csrf.php';

ApiResponse::handleCors();

$user = AuthMiddleware::requireAuth();
$csrfToken = CsrfMiddleware::getToken();

ApiResponse::success([
    'user' => [
        'id' => (int)$user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
    'csrf_token' => $csrfToken,
], 'User profile retrieved');

