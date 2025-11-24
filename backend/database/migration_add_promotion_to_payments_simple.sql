-- ============================================
-- MIGRATION: Thêm promotion_id vào bảng Payments
-- ============================================
-- File này dùng để cập nhật database đã tồn tại
-- Chạy file này nếu database đã được tạo từ cinema_schema.sql cũ

USE `cinema_dev`;

-- Thêm cột promotion_id vào bảng Payments
-- Lưu ý: Nếu cột đã tồn tại, sẽ báo lỗi. Bạn có thể bỏ qua lỗi đó.
ALTER TABLE `Payments` 
ADD COLUMN `promotion_id` INT NULL COMMENT 'ID mã khuyến mãi (nếu có)';

-- Thêm foreign key constraint
-- Lưu ý: Nếu constraint đã tồn tại, sẽ báo lỗi. Bạn có thể bỏ qua lỗi đó.
ALTER TABLE `Payments` 
ADD CONSTRAINT `fk_payments_promotion` 
FOREIGN KEY (`promotion_id`) 
REFERENCES `promotions`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Thêm index cho promotion_id
-- Lưu ý: Nếu index đã tồn tại, sẽ báo lỗi. Bạn có thể bỏ qua lỗi đó.
ALTER TABLE `Payments` 
ADD INDEX `idx_payments_promotion_id` (`promotion_id`);

-- Kiểm tra kết quả
SELECT 'Migration completed!' AS status;
DESCRIBE `Payments`;









