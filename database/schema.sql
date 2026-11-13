-- ==============================================================================
-- ClickNCult - WhatsApp Analytics Platform
-- Database Schema: Tables & Admin Seed Data
-- Target: MySQL 8.0+ / MariaDB 10.5+ (InnoDB, utf8mb4)
-- Note for Hostinger / cPanel phpMyAdmin:
-- Select your database in phpMyAdmin and click Import -> schema.sql
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `webhook_logs`;
DROP TABLE IF EXISTS `whatsapp_message_events`;
DROP TABLE IF EXISTS `whatsapp_messages`;
DROP TABLE IF EXISTS `whatsapp_campaigns`;
DROP TABLE IF EXISTS `admin_users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. Table: admin_users
-- Stores administrator credentials with secure bcrypt/argon2 hashing
-- ------------------------------------------------------------------------------
CREATE TABLE `admin_users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `last_login_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: whatsapp_campaigns
-- Aggregates campaigns identified from MSG91 reports
-- ------------------------------------------------------------------------------
CREATE TABLE `whatsapp_campaigns` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_key` VARCHAR(191) NOT NULL,
  `campaign_name` VARCHAR(191) NULL,
  `campaign_request_id` VARCHAR(191) NULL,
  `template_name` VARCHAR(191) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_campaign_key` (`campaign_key`),
  KEY `idx_camp_name` (`campaign_name`),
  KEY `idx_camp_rqid` (`campaign_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: whatsapp_messages
-- Stores unique WhatsApp messages and their current consolidated delivery lifecycle
-- ------------------------------------------------------------------------------
CREATE TABLE `whatsapp_messages` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `message_key` VARCHAR(191) NOT NULL,
  `uuid` VARCHAR(191) NULL,
  `crqid` VARCHAR(191) NULL,
  `request_id` VARCHAR(191) NULL,
  `customer_number` VARCHAR(50) NOT NULL,
  `integrated_number` VARCHAR(50) NULL,
  `direction` VARCHAR(20) NOT NULL DEFAULT 'outbound',
  `campaign_name` VARCHAR(191) NULL,
  `campaign_request_id` VARCHAR(191) NULL,
  `template_name` VARCHAR(191) NULL,
  `template_language` VARCHAR(20) NULL,
  `content` TEXT NULL,
  `content_type` VARCHAR(50) NULL DEFAULT 'text',
  `message_type` VARCHAR(50) NULL DEFAULT 'text',
  `current_status` VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  `status_code` VARCHAR(50) NULL,
  `failure_reason` TEXT NULL,
  `price` DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
  `requested_at` DATETIME NULL,
  `submitted_at` DATETIME NULL,
  `sent_at` DATETIME NULL,
  `delivered_at` DATETIME NULL,
  `read_at` DATETIME NULL,
  `failed_at` DATETIME NULL,
  `status_updated_at` DATETIME NULL,
  `raw_payload` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_message_key` (`message_key`),
  KEY `idx_msg_uuid` (`uuid`),
  KEY `idx_msg_crqid` (`crqid`),
  KEY `idx_msg_request_id` (`request_id`),
  KEY `idx_msg_customer` (`customer_number`),
  KEY `idx_msg_status` (`current_status`),
  KEY `idx_msg_camp_name` (`campaign_name`),
  KEY `idx_msg_camp_rqid` (`campaign_request_id`),
  KEY `idx_msg_template` (`template_name`),
  KEY `idx_msg_requested` (`requested_at`),
  KEY `idx_msg_delivered` (`delivered_at`),
  KEY `idx_msg_read` (`read_at`),
  KEY `idx_msg_failed` (`failed_at`),
  KEY `idx_msg_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: whatsapp_message_events
-- Complete immutable audit trail of every webhook status report received
-- ------------------------------------------------------------------------------
CREATE TABLE `whatsapp_message_events` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `message_id` BIGINT UNSIGNED NOT NULL,
  `event_name` VARCHAR(50) NOT NULL,
  `status_code` VARCHAR(50) NULL,
  `normalized_status` VARCHAR(50) NOT NULL,
  `event_timestamp` DATETIME NOT NULL,
  `reason` TEXT NULL,
  `event_hash` VARCHAR(64) NOT NULL,
  `raw_payload` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_event_hash` (`event_hash`),
  KEY `idx_m_events_msg_id` (`message_id`),
  KEY `idx_m_events_norm_status` (`normalized_status`),
  KEY `idx_m_events_ts` (`event_timestamp`),
  CONSTRAINT `fk_events_message` FOREIGN KEY (`message_id`)
    REFERENCES `whatsapp_messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: webhook_logs
-- Observability & debugging for all incoming HTTP payloads
-- ------------------------------------------------------------------------------
CREATE TABLE `webhook_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `source` VARCHAR(50) NOT NULL DEFAULT 'MSG91',
  `event_type` VARCHAR(100) NULL,
  `processing_status` ENUM('success', 'duplicate', 'unmatched', 'error', 'ignored') NOT NULL DEFAULT 'success',
  `message_id` BIGINT UNSIGNED NULL,
  `error_message` TEXT NULL,
  `raw_payload` JSON NULL,
  `received_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_webhook_logs_status` (`processing_status`),
  KEY `idx_webhook_logs_received` (`received_at`),
  KEY `idx_webhook_logs_msg_id` (`message_id`),
  CONSTRAINT `fk_webhook_logs_msg` FOREIGN KEY (`message_id`)
    REFERENCES `whatsapp_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Initial Seed: Default Administrator User
-- Email: admin@clickncult.com
-- Default Password: Admin@ClickNCult2026!
-- Hash generated via password_hash('Admin@ClickNCult2026!', PASSWORD_BCRYPT)
-- ------------------------------------------------------------------------------
INSERT INTO `admin_users` (`name`, `email`, `password_hash`, `role`)
VALUES (
  'ClickNCult Admin',
  'admin@clickncult.com',
  '$2y$10$wK1F5y3zLq.N6QpD4Bqmye0lWqK2bU9sT8k7pZ0xV9R1u1q4tSZeG',
  'admin'
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
