<?php
declare(strict_types=1);

/**
 * ClickNCult - Admin Logout API Endpoint
 * POST /api/auth/logout.php
 */

require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

ApiResponse::handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Method Not Allowed', 405);
}

AuthMiddleware::logout();

ApiResponse::success(null, 'Logged out successfully');

