<?php
declare(strict_types=1);

/**
 * ClickNCult Standard Response Helper & CORS Handler
 */

class ApiResponse
{
    public static function handleCors(): void
    {
        $config = require __DIR__ . '/../config/app.php';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (!empty($origin) && in_array($origin, $config['cors']['allowed_origins'], true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header("Access-Control-Allow-Credentials: true");
        } else {
            // Default permissive for same-domain or fallback development
            $fallback = $config['cors']['allowed_origins'][0] ?? '*';
            header("Access-Control-Allow-Origin: {$fallback}");
            header("Access-Control-Allow-Credentials: true");
        }

        header("Access-Control-Allow-Methods: " . $config['cors']['allowed_methods']);
        header("Access-Control-Allow-Headers: " . $config['cors']['allowed_headers']);

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit();
        }
    }

    public static function json(mixed $data = null, string $message = 'Request completed', int $status = 200, bool $success = true): void
    {
        self::handleCors();
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            'success' => $success,
            'message' => $message,
            'data' => $data ?? new stdClass(),
        ];

        echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit();
    }

    public static function success(mixed $data = null, string $message = 'Success', int $status = 200): void
    {
        self::json($data, $message, $status, true);
    }

    public static function error(string $message = 'An error occurred', int $status = 400, mixed $errors = null): void
    {
        self::handleCors();
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            'success' => false,
            'message' => $message,
            'data' => $errors ?? new stdClass(),
        ];

        echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit();
    }

    public static function unauthorized(string $message = 'Unauthorized access'): void
    {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Resource not found'): void
    {
        self::error($message, 404);
    }
}

