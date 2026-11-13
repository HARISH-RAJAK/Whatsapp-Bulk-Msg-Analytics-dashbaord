<?php
declare(strict_types=1);

/**
 * ClickNCult Authentication Middleware
 * Manages PHP session lifecycle, session regeneration, and endpoint protection
 */

require_once __DIR__ . '/../helpers/response.php';

class AuthMiddleware
{
    private static bool $sessionStarted = false;

    public static function startSession(): void
    {
        if (self::$sessionStarted || session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $config = require __DIR__ . '/../config/app.php';
        $sessionOpts = $config['session'];

        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_samesite', $sessionOpts['samesite']);
        if ($sessionOpts['secure']) {
            ini_set('session.cookie_secure', '1');
        }

        session_name($sessionOpts['name']);
        session_set_cookie_params([
            'lifetime' => $sessionOpts['lifetime'],
            'path' => $sessionOpts['path'],
            'domain' => $sessionOpts['domain'],
            'secure' => $sessionOpts['secure'],
            'httponly' => $sessionOpts['httponly'],
            'samesite' => $sessionOpts['samesite'],
        ]);

        session_start();
        self::$sessionStarted = true;
    }

    public static function requireAuth(): array
    {
        self::startSession();

        if (empty($_SESSION['admin_user']) || empty($_SESSION['admin_user']['id'])) {
            ApiResponse::unauthorized('Authentication required. Please log in.');
        }

        return $_SESSION['admin_user'];
    }

    public static function getAuthenticatedUser(): ?array
    {
        self::startSession();
        return $_SESSION['admin_user'] ?? null;
    }

    public static function login(array $user): void
    {
        self::startSession();
        session_regenerate_id(true);

        // Strip password_hash from session object
        unset($user['password_hash']);
        $_SESSION['admin_user'] = $user;
        $_SESSION['logged_at'] = time();

        // Also generate CSRF token for this session
        require_once __DIR__ . '/csrf.php';
        CsrfMiddleware::generateToken();
    }

    public static function logout(): void
    {
        self::startSession();
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        self::$sessionStarted = false;
    }
}

