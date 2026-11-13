<?php
declare(strict_types=1);

/**
 * ClickNCult CSRF Protection Middleware
 */

class CsrfMiddleware
{
    public static function generateToken(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function getToken(): string
    {
        return self::generateToken();
    }

    public static function validate(): void
    {
        // Skip for GET, HEAD, OPTIONS
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        if (!$token && isset($_POST['csrf_token'])) {
            $token = $_POST['csrf_token'];
        }

        if (empty($token) || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
            require_once __DIR__ . '/../helpers/response.php';
            ApiResponse::forbidden('Invalid or missing CSRF token.');
        }
    }
}

