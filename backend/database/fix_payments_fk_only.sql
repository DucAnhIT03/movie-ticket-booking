-- Simple script to fix foreign key constraint only
-- This script only changes the foreign key constraint from CASCADE to RESTRICT
-- It doesn't rename tables, so it's safe to run even if both Payments and payments exist

USE `cinema_dev`;

-- Fix foreign key constraint on payments table (lowercase)
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND CONSTRAINT_NAME = 'fk_payments_booking'
);

-- Drop existing constraint if exists
SET @sql = IF(@constraint_exists > 0,
  'ALTER TABLE `payments` DROP FOREIGN KEY `fk_payments_booking`',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add constraint with RESTRICT
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
);

SET @sql = IF(@table_exists > 0,
  'ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT "payments table does not exist" AS error'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Also fix Payments table (uppercase) if it exists
SET @Payments_constraint_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Payments'
    AND CONSTRAINT_NAME = 'fk_payments_booking'
);

SET @sql = IF(@Payments_constraint_exists > 0,
  'ALTER TABLE `Payments` DROP FOREIGN KEY `fk_payments_booking`',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @Payments_table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Payments'
);

SET @sql = IF(@Payments_table_exists > 0,
  'ALTER TABLE `Payments` ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Foreign key constraint fixed: CASCADE changed to RESTRICT' AS result;

