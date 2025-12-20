-- Migration script to fix chat_conversations table columns
-- This script renames columns to match the entity definition

USE `cinema_dev`;

-- Check if old columns exist and rename them, or add new columns if needed
-- Handle user_unread_count
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'user_unread_count'
);

SET @old_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'unread_count_user'
);

-- Rename unread_count_user to user_unread_count if old column exists and new doesn't
SET @sql = IF(@col_exists = 0 AND @old_col_exists > 0,
  'ALTER TABLE `chat_conversations` CHANGE COLUMN `unread_count_user` `user_unread_count` INT NOT NULL DEFAULT 0',
  IF(@col_exists = 0,
    'ALTER TABLE `chat_conversations` ADD COLUMN `user_unread_count` INT NOT NULL DEFAULT 0',
    'SELECT 1 AS noop'
  )
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Handle staff_unread_count
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'staff_unread_count'
);

SET @old_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'unread_count_staff'
);

-- Rename unread_count_staff to staff_unread_count if old column exists and new doesn't
SET @sql = IF(@col_exists = 0 AND @old_col_exists > 0,
  'ALTER TABLE `chat_conversations` CHANGE COLUMN `unread_count_staff` `staff_unread_count` INT NOT NULL DEFAULT 0',
  IF(@col_exists = 0,
    'ALTER TABLE `chat_conversations` ADD COLUMN `staff_unread_count` INT NOT NULL DEFAULT 0',
    'SELECT 1 AS noop'
  )
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Handle is_active column
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_conversations'
    AND COLUMN_NAME = 'is_active'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `chat_conversations` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE',
  'SELECT 1 AS noop'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for is_active if it doesn't exist
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_conversations'
    AND INDEX_NAME = 'idx_conversation_active'
);

SET @sql = IF(@index_exists = 0,
  'ALTER TABLE `chat_conversations` ADD INDEX `idx_conversation_active` (`is_active`)',
  'SELECT 1 AS noop'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed successfully!' AS result;

