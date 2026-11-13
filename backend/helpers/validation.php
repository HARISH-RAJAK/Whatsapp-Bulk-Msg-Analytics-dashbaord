<?php
declare(strict_types=1);

/**
 * ClickNCult Input Validation and Sanitization Helper
 */

class Validator
{
    public static function getJsonInput(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidArgumentException('Malformed JSON payload: ' . json_last_error_msg());
        }

        return is_array($decoded) ? $decoded : [];
    }

    public static function sanitizeString(?string $value): string
    {
        return $value !== null ? trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8')) : '';
    }

    public static function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function isValidPhone(string $phone): bool
    {
        // Matches common international formats: 10 to 15 digits with optional leading +
        return (bool) preg_match('/^\+?[0-9]{10,15}$/', trim($phone));
    }

    public static function parsePagination(array $query, int $defaultLimit = 25, int $maxLimit = 100): array
    {
        $page = isset($query['page']) ? (int)$query['page'] : 1;
        $limit = isset($query['limit']) ? (int)$query['limit'] : $defaultLimit;

        if ($page < 1) $page = 1;
        if ($limit < 1) $limit = $defaultLimit;
        if ($limit > $maxLimit) $limit = $maxLimit;

        $offset = ($page - 1) * $limit;

        return [
            'page' => $page,
            'limit' => $limit,
            'offset' => $offset,
        ];
    }

    public static function sanitizeSortColumn(string $requestedColumn, array $allowedColumns, string $default = 'created_at'): string
    {
        return in_array($requestedColumn, $allowedColumns, true) ? $requestedColumn : $default;
    }

    public static function sanitizeSortDirection(string $direction, string $default = 'DESC'): string
    {
        $dir = strtoupper(trim($direction));
        return in_array($dir, ['ASC', 'DESC'], true) ? $dir : $default;
    }
}

