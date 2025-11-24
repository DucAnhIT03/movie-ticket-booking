-- ============================================
-- MIGRATION: Thêm promotion_id vào bảng Payments
-- ============================================
-- File này dùng để cập nhật database đã tồn tại
-- Chạy file này nếu database đã được tạo từ cinema_schema.sql cũ

USE `cinema_dev`;

-- Kiểm tra và thêm cột promotion_id vào bảng Payments (nếu chưa có)
-- Sử dụng IF NOT EXISTS để tránh lỗi nếu cột đã tồn tại
SET @dbname = DATABASE();
SET @tablename = "Payments";
SET @columnname = "promotion_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.' AS message;",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @columnname, "` INT NULL COMMENT 'ID mã khuyến mãi (nếu có)';")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm foreign key constraint (nếu chưa có)
-- Kiểm tra xem constraint đã tồn tại chưa
SET @constraint_name = "fk_payments_promotion";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraint_name)
  ) > 0,
  "SELECT 'Foreign key already exists.' AS message;",
  CONCAT("ALTER TABLE `", @tablename, "` ADD CONSTRAINT `", @constraint_name, "` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm index cho promotion_id (nếu chưa có)
SET @index_name = "idx_payments_promotion_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @index_name)
  ) > 0,
  "SELECT 'Index already exists.' AS message;",
  CONCAT("ALTER TABLE `", @tablename, "` ADD INDEX `", @index_name, "` (`promotion_id`);")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Kiểm tra kết quả
SELECT 
    'Migration completed successfully!' AS status,
    'promotion_id column added to Payments table' AS message;

-- Xem cấu trúc bảng sau khi migration
DESCRIBE `Payments`;

