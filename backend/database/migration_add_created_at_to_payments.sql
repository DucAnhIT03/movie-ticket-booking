-- Migration: Add created_at column to Payments table
-- Date: 2025-11-23
-- Description: Add created_at column to track when payment was created for seat locking timeout feature

ALTER TABLE `Payments` 
ADD COLUMN `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
AFTER `payment_time`;

-- Update existing records to set created_at to payment_time if available, otherwise use current timestamp
UPDATE `Payments` 
SET `created_at` = COALESCE(`payment_time`, NOW()) 
WHERE `created_at` IS NULL OR `created_at` = '0000-00-00 00:00:00';

-- Add index for better query performance
ALTER TABLE `Payments` 
ADD INDEX `idx_payments_created_at` (`created_at`);

