<?php
declare(strict_types=1);

/**
 * ClickNCult WhatsApp Analytics Platform
 * Application Configuration
 */

// Load environment variables from .env
require_once __DIR__ . '/env.php';

// Report error settings
$isDebug = (bool)(getenv('APP_DEBUG') ?: false);
error_reporting(E_ALL);
ini_set('display_errors', $isDebug ? '1' : '0');
ini_set('log_errors', '1');

// Process configured Frontend URLs (single or comma-separated)
$configuredFrontendUrl = getenv('FRONTEND_URL') ?: 'http://localhost:5173';
$allowedFrontendOrigins = array_filter(array_map('trim', explode(',', $configuredFrontendUrl)));

// Combine with common dev fallbacks
$allowedOrigins = array_unique(array_merge(
    $allowedFrontendOrigins,
    [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
    ]
));

return [
    'app_name' => 'ClickNCult WhatsApp Analytics',
    'company_name' => 'ClickNCult',
    'environment' => getenv('APP_ENV') ?: 'production',
    'debug' => $isDebug,
    'base_url' => getenv('APP_URL') ?: 'http://localhost:8000',
    'frontend_url' => $allowedFrontendOrigins[0] ?? 'http://localhost:5173',
    
    // Timezones: All database storage in UTC, presentation in Asia/Kolkata
    'storage_timezone' => 'UTC',
    'display_timezone' => 'Asia/Kolkata',

    // Security & Authentication
    'session' => [
        'name' => 'CLICKNCULT_SESSID',
        'lifetime' => 86400, // 24 hours
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax',
    ],

    // MSG91 Webhook Security
    // Set WEBHOOK_SECRET in environment to enforce token verification
    // MSG91 allows query parameter token or custom header 'X-Webhook-Secret'
    'webhook' => [
        'secret' => getenv('MSG91_WEBHOOK_SECRET') ?: '',
        'token_query_param' => 'token',
        'secret_header' => 'HTTP_X_WEBHOOK_SECRET',
        'require_auth' => (bool)(getenv('MSG91_REQUIRE_AUTH') ?: false),
    ],

    // CORS Configuration
    'cors' => [
        'allowed_origins' => array_values($allowedOrigins),
        'allowed_methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'allowed_headers' => 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
        'allow_credentials' => true,
    ],
];
