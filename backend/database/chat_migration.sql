-- Migration script for Chat feature
-- Run this script to create the necessary tables for the chat functionality

USE `cinema_dev`;

-- Table: chat_conversations
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `staff_id` INT NULL COMMENT 'ID nhân viên được gán cho rạp',
  `theater_id` INT NOT NULL,
  `last_message` TEXT NULL,
  `last_message_at` DATETIME NULL,
  `user_unread_count` INT NOT NULL DEFAULT 0,
  `staff_unread_count` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_conversation_user` (`user_id`),
  INDEX `idx_conversation_staff` (`staff_id`),
  INDEX `idx_conversation_theater` (`theater_id`),
  INDEX `idx_conversation_active` (`is_active`),
  UNIQUE KEY `uk_conversation_user_theater` (`user_id`, `theater_id`),
  CONSTRAINT `fk_conversation_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_conversation_staff` FOREIGN KEY (`staff_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_conversation_theater` FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: chat_messages
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `staff_id` INT NULL COMMENT 'ID nhân viên (nếu tin nhắn từ staff)',
  `theater_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_from_staff` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_message_user` (`user_id`),
  INDEX `idx_message_staff` (`staff_id`),
  INDEX `idx_message_theater` (`theater_id`),
  INDEX `idx_message_created` (`created_at`),
  INDEX `idx_message_read` (`is_read`),
  CONSTRAINT `fk_message_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_message_staff` FOREIGN KEY (`staff_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_message_theater` FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


