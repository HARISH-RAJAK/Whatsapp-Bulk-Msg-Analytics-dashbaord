<?php
declare(strict_types=1);

/**
 * ClickNCult Timezone Helper
 * Enforces UTC for storage and Asia/Kolkata for presentation
 */

class TimezoneHelper
{
    public const STORAGE_TZ = 'UTC';
    public const DISPLAY_TZ = 'Asia/Kolkata';

    /**
     * Parse any incoming timestamp string (e.g. "2025-07-15T11:22:55+05:30" or unix timestamp)
     * and return 'Y-m-d H:i:s' in UTC for database insertion.
     */
    public static function toUtcSql(?string $input): ?string
    {
        if (empty($input)) {
            return null;
        }

        try {
            // Check if numeric unix timestamp (seconds or milliseconds)
            if (is_numeric($input)) {
                $ts = (int)$input;
                if ($ts > 9999999999) { // milliseconds
                    $ts = (int)($ts / 1000);
                }
                $dt = new DateTime("@{$ts}");
            } else {
                $dt = new DateTime($input);
            }
            $dt->setTimezone(new DateTimeZone(self::STORAGE_TZ));
            return $dt->format('Y-m-d H:i:s');
        } catch (Exception $e) {
            error_log("Failed to parse timestamp '{$input}': " . $e->getMessage());
            return null;
        }
    }

    /**
     * Convert UTC database timestamp to Asia/Kolkata ISO-8601 or formatted string for API
     */
    public static function toDisplayTz(?string $utcDate, string $format = 'Y-m-d H:i:s'): ?string
    {
        if (empty($utcDate)) {
            return null;
        }

        try {
            $dt = new DateTime($utcDate, new DateTimeZone(self::STORAGE_TZ));
            $dt->setTimezone(new DateTimeZone(self::DISPLAY_TZ));
            return $dt->format($format);
        } catch (Exception $e) {
            return $utcDate;
        }
    }

    /**
     * Get current UTC timestamp for DB
     */
    public static function nowUtc(): string
    {
        $dt = new DateTime('now', new DateTimeZone(self::STORAGE_TZ));
        return $dt->format('Y-m-d H:i:s');
    }

    /**
     * Resolve date range filter into UTC start and end bounds
     * Support filters: today, yesterday, last_7_days, last_30_days, this_month, previous_month, custom
     */
    public static function resolveDateRangeFilter(?string $preset, ?string $customStart = null, ?string $customEnd = null): array
    {
        $kolkataTz = new DateTimeZone(self::DISPLAY_TZ);
        $utcTz = new DateTimeZone(self::STORAGE_TZ);

        $nowKolkata = new DateTime('now', $kolkataTz);

        $startDate = null;
        $endDate = null;

        switch (strtolower((string)$preset)) {
            case 'today':
                $startDate = (clone $nowKolkata)->setTime(0, 0, 0);
                $endDate = (clone $nowKolkata)->setTime(23, 59, 59);
                break;

            case 'yesterday':
                $startDate = (clone $nowKolkata)->modify('-1 day')->setTime(0, 0, 0);
                $endDate = (clone $nowKolkata)->modify('-1 day')->setTime(23, 59, 59);
                break;

            case 'last_7_days':
                $startDate = (clone $nowKolkata)->modify('-6 days')->setTime(0, 0, 0);
                $endDate = (clone $nowKolkata)->setTime(23, 59, 59);
                break;

            case 'last_30_days':
                $startDate = (clone $nowKolkata)->modify('-29 days')->setTime(0, 0, 0);
                $endDate = (clone $nowKolkata)->setTime(23, 59, 59);
                break;

            case 'this_month':
                $startDate = (clone $nowKolkata)->modify('first day of this month')->setTime(0, 0, 0);
                $endDate = (clone $nowKolkata)->setTime(23, 59, 59);
                break;

            case 'previous_month':
                $startDate = (clone $nowKolkata)->modify('first day of last month')->setTime(0, 0, 0);
                $endDate = (clone $nowKolkata)->modify('last day of last month')->setTime(23, 59, 59);
                break;

            case 'custom':
                if (!empty($customStart)) {
                    $startDate = new DateTime($customStart . ' 00:00:00', $kolkataTz);
                }
                if (!empty($customEnd)) {
                    $endDate = new DateTime($customEnd . ' 23:59:59', $kolkataTz);
                }
                break;

            default:
                // Default to last 30 days if unspecified
                $startDate = (clone $nowKolkata)->modify('-29 days')->setTime(0, 0, 0);
                $endDate = (clone $nowKolkata)->setTime(23, 59, 59);
                break;
        }

        $utcStart = null;
        $utcEnd = null;

        if ($startDate !== null) {
            $startDate->setTimezone($utcTz);
            $utcStart = $startDate->format('Y-m-d H:i:s');
        }

        if ($endDate !== null) {
            $endDate->setTimezone($utcTz);
            $utcEnd = $endDate->format('Y-m-d H:i:s');
        }

        return [
            'start_utc' => $utcStart,
            'end_utc' => $utcEnd,
            'preset' => $preset ?: 'last_30_days',
            'display_tz' => self::DISPLAY_TZ,
        ];
    }
}

