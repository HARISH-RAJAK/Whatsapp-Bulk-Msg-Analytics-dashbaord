<?php
declare(strict_types=1);

/**
 * ClickNCult WhatsApp Analytics Platform
 * Database Connection Provider (PDO Singleton)
 */

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $dbname = getenv('DB_DATABASE') ?: 'clickncult_analytics';
            $host = getenv('DB_HOST') ?: 'localhost';
            // Hostinger safety fallback: If DB_HOST was accidentally set to the database name
            if ($host === $dbname || (!str_contains($host, '.') && $host !== 'localhost')) {
                $host = 'localhost';
            }
            $port = getenv('DB_PORT') ?: '3306';
            $user = getenv('DB_USERNAME') ?: 'root';
            $password = getenv('DB_PASSWORD') ?: '';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00'",
            ];

            try {
                self::$instance = new PDO($dsn, $user, $password, $options);
            } catch (PDOException $e) {
                error_log("ClickNCult DB Connection Failed: " . $e->getMessage());
                // Never expose raw credentials or stack traces to client
                throw new RuntimeException("Database service unavailable.");
            }
        }

        return self::$instance;
    }

    public static function setMockConnection(?PDO $mockPdo): void
    {
        self::$instance = $mockPdo;
    }
}

