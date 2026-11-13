<?php
declare(strict_types=1);

/**
 * ClickNCult Environment File Loader
 * Lightweight, zero-dependency .env parser for Core PHP
 */

class EnvLoader
{
    private static bool $loaded = false;

    public static function load(?string $dir = null): void
    {
        if (self::$loaded) {
            return;
        }

        $searchPaths = [
            $dir ? rtrim($dir, '/\\') . '/.env' : null,
            __DIR__ . '/../.env',
            __DIR__ . '/../../.env',
            dirname(__DIR__, 2) . '/.env',
        ];

        foreach ($searchPaths as $path) {
            if ($path && file_exists($path) && is_readable($path)) {
                self::parse($path);
                self::$loaded = true;
                break;
            }
        }
    }

    private static function parse(string $filePath): void
    {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            // Skip empty lines or comments
            if ($line === '' || str_starts_with($line, '#') || str_starts_with($line, ';')) {
                continue;
            }

            // Split on the first '=' sign
            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }

            $key = trim($parts[0]);
            $val = trim($parts[1]);

            // Strip surrounding single or double quotes
            if (
                (str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))
            ) {
                $val = substr($val, 1, -1);
            }

            // Only set if not already set by system/server environment
            if (getenv($key) === false) {
                putenv("{$key}={$val}");
            }
            if (!isset($_ENV[$key])) {
                $_ENV[$key] = $val;
            }
            if (!isset($_SERVER[$key])) {
                $_SERVER[$key] = $val;
            }
        }
    }
}

// Auto-load .env
EnvLoader::load();

