-- Migration script to fix payments table issues
-- 1. Rename table from Payments to payments (if exists)
-- 2. Change foreign key constraint from CASCADE to RESTRICT

USE `cinema_dev`;

-- Check which table exists
SET @payments_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
);

SET @Payments_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Payments'
);

-- Drop existing foreign key constraint from Payments table if exists
SET @constraint_exists_payments = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Payments'
    AND CONSTRAINT_NAME = 'fk_payments_booking'
);

SET @sql = IF(@constraint_exists_payments > 0,
  'ALTER TABLE `Payments` DROP FOREIGN KEY `fk_payments_booking`',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop existing foreign key constraint from payments table if exists
SET @constraint_exists_payments_lower = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND CONSTRAINT_NAME = 'fk_payments_booking'
);

SET @sql = IF(@constraint_exists_payments_lower > 0,
  'ALTER TABLE `payments` DROP FOREIGN KEY `fk_payments_booking`',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Handle table rename: if Payments exists and payments doesn't, rename it
-- If both exist, we need to merge data (skip for now, just use payments)
-- If only payments exists, do nothing
SET @sql = IF(@Payments_exists > 0 AND @payments_exists = 0,
  'RENAME TABLE `Payments` TO `payments`',
  IF(@Payments_exists > 0 AND @payments_exists > 0,
    'SELECT "Both Payments and payments exist. Please manually merge data and drop Payments table." AS warning',
    'SELECT 1'
  )
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint with RESTRICT (prevent cascade delete)
-- Use the table that exists (payments)
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND CONSTRAINT_NAME = 'fk_payments_booking'
);

SET @sql = IF(@constraint_exists = 0 AND @payments_exists > 0,
  'ALTER TABLE `payments` ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration completed: payments table fixed' AS result;

