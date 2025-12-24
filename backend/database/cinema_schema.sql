CREATE DATABASE IF NOT EXISTS `cinema_devvvvvv`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `cinema_devvvvvv`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `phone` VARCHAR(11) NULL,
  `address` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  `status` ENUM('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `theater_id` INT NULL COMMENT 'ID rạp được gán cho nhân viên (NULL = chưa gán)',
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_created_at` (`created_at`),
  INDEX `idx_users_theater_id` (`theater_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` ENUM('ROLE_ADMIN','ROLE_USER','ROLE_EMPLOYEE') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) user_roles (composite PK)
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Theaters
CREATE TABLE IF NOT EXISTS `Theaters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_theater_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Screens
CREATE TABLE IF NOT EXISTS `Screens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `seat_capacity` INT NOT NULL,
  `theater_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_screens_theater` FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_screens_theater_id` (`theater_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Genre
CREATE TABLE IF NOT EXISTS `Genre` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `genre_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  UNIQUE KEY `uk_genre_name` (`genre_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) Movies
CREATE TABLE IF NOT EXISTS `Movies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `descriptions` TEXT NULL,
  `author` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `image` VARCHAR(255) NULL,
  `trailer` VARCHAR(255) NULL,
  `type` ENUM('2D','3D') NOT NULL,
  `duration` INT NOT NULL,
  `release_date` DATETIME NOT NULL,
  `start_date` DATETIME NULL COMMENT 'Ngày bắt đầu công chiếu',
  `end_date` DATETIME NULL COMMENT 'Ngày kết thúc công chiếu',
  `rating_warning` TEXT NULL COMMENT 'Cảnh báo yêu cầu của phim (ví dụ: PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+))',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_movies_type` (`type`),
  INDEX `idx_movies_release_date` (`release_date`),
  INDEX `idx_movies_start_date` (`start_date`),
  INDEX `idx_movies_end_date` (`end_date`),
  FULLTEXT INDEX `ft_movies_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8) Movie_Genre (composite PK)
CREATE TABLE IF NOT EXISTS `Movie_Genre` (
  `movie_id` INT NOT NULL,
  `genre_id` INT NOT NULL,
  PRIMARY KEY (`movie_id`,`genre_id`),
  CONSTRAINT `fk_movie_genre_movie` FOREIGN KEY (`movie_id`) REFERENCES `Movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_movie_genre_genre` FOREIGN KEY (`genre_id`) REFERENCES `Genre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9) ShowTimes
CREATE TABLE IF NOT EXISTS `ShowTimes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `screen_id` INT NOT NULL,
  `movie_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_showtimes_screen` FOREIGN KEY (`screen_id`) REFERENCES `Screens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_showtimes_movie` FOREIGN KEY (`movie_id`) REFERENCES `Movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_showtimes_screen_id` (`screen_id`),
  INDEX `idx_showtimes_movie_id` (`movie_id`),
  INDEX `idx_showtimes_start_time` (`start_time`),
  INDEX `idx_showtimes_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10) Bookings
CREATE TABLE IF NOT EXISTS `Bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `showtime_id` INT NOT NULL,
  `total_seat` INT NOT NULL,
  `total_price_movie` DOUBLE NOT NULL,
  `channel` ENUM('ONLINE','OFFLINE') NOT NULL DEFAULT 'ONLINE',
  `customer_name` VARCHAR(255) NULL,
  `customer_phone` VARCHAR(20) NULL,
  `created_by_staff_id` INT NULL,
  `invoice_code` VARCHAR(50) NULL UNIQUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_showtime` FOREIGN KEY (`showtime_id`) REFERENCES `ShowTimes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_staff` FOREIGN KEY (`created_by_staff_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_bookings_user_id` (`user_id`),
  INDEX `idx_bookings_showtime_id` (`showtime_id`),
  INDEX `idx_bookings_created_at` (`created_at`),
  INDEX `idx_bookings_invoice_code` (`invoice_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11) Seats
CREATE TABLE IF NOT EXISTS `Seats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `screen_id` INT NOT NULL,
  `seat_number` VARCHAR(50) NOT NULL,
  `is_variable` BIT(1) NOT NULL DEFAULT b'0',
  `is_hidden` BIT(1) NOT NULL DEFAULT b'0' COMMENT 'Ẩn ghế khỏi người dùng',
  `type` ENUM('STANDARD','VIP','SWEETBOX') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_seats_screen` FOREIGN KEY (`screen_id`) REFERENCES `Screens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_seat_screen_number` (`screen_id`,`seat_number`),
  INDEX `idx_seats_screen_id` (`screen_id`),
  INDEX `idx_seats_type` (`type`),
  INDEX `idx_seats_is_hidden` (`is_hidden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12) Booking_Seat
CREATE TABLE IF NOT EXISTS `Booking_Seat` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `seat_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_booking_seat_booking` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_seat_seat` FOREIGN KEY (`seat_id`) REFERENCES `Seats`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_booking_seat_booking_id` (`booking_id`),
  INDEX `idx_booking_seat_seat_id` (`seat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13) Banners
CREATE TABLE IF NOT EXISTS `Banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `url` VARCHAR(255) NOT NULL,
  `type` ENUM('IMAGE','VIDEO') NOT NULL,
  `position` VARCHAR(255) NOT NULL,
  `width` INT NULL,
  `height` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_banner_type` (`type`),
  INDEX `idx_banner_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13.5) Poster (chỉ có một poster duy nhất)
CREATE TABLE IF NOT EXISTS `Poster` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image_url` VARCHAR(500) NULL COMMENT 'URL ảnh poster (kích thước khuyến nghị: 1440x810px)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_poster_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13.6) BannerPoster (chỉ có một poster banner duy nhất)
CREATE TABLE IF NOT EXISTS `BannerPoster` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image_url` VARCHAR(500) NULL COMMENT 'URL ảnh poster banner (kích thước khuyến nghị: 1440x810px)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_banner_poster_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14) Festival
CREATE TABLE IF NOT EXISTS `Festival` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image` VARCHAR(255) NULL,
  `content` LONGTEXT NULL COMMENT 'Nội dung mô tả lễ hội',
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_festival_start_time` (`start_time`),
  INDEX `idx_festival_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14.5) Events
CREATE TABLE IF NOT EXISTS `Events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `image` VARCHAR(255) NULL,
  `content` LONGTEXT NULL,
  `location` VARCHAR(255) NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `status` ENUM('UPCOMING','ONGOING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'UPCOMING',
  `is_special` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_events_status` (`status`),
  INDEX `idx_events_is_special` (`is_special`),
  INDEX `idx_events_start_time` (`start_time`),
  INDEX `idx_events_end_time` (`end_time`),
  INDEX `idx_events_location` (`location`),
  FULLTEXT INDEX `ft_events_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EventRegistrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_event_reg_event` FOREIGN KEY (`event_id`) REFERENCES `Events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_event_reg_event_id` (`event_id`),
  INDEX `idx_event_reg_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15) News
CREATE TABLE IF NOT EXISTS `News` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NULL,
  `image` VARCHAR(500) NULL COMMENT 'URL ảnh tin tức',
  `festival_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_news_festival` FOREIGN KEY (`festival_id`) REFERENCES `Festival`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_news_festival_id` (`festival_id`),
  INDEX `idx_news_created_at` (`created_at`),
  FULLTEXT INDEX `ft_news_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16) Ticket_Prices
CREATE TABLE IF NOT EXISTS `Ticket_Prices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type_seat` ENUM('STANDARD','VIP','SWEETBOX') NOT NULL,
  `type_movie` ENUM('2D','3D') NOT NULL,
  `price` DOUBLE NOT NULL,
  `day_type` BIT(1) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `theater_id` INT NULL COMMENT 'ID rạp (NULL = áp dụng cho tất cả rạp)',
  `start_date` DATE NULL COMMENT 'Ngày bắt đầu áp dụng giá (NULL = áp dụng từ đầu)',
  `end_date` DATE NULL COMMENT 'Ngày kết thúc áp dụng giá (NULL = áp dụng mãi mãi)',
  `movie_id` INT NULL COMMENT 'ID phim cụ thể (NULL = áp dụng cho tất cả phim cùng type)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_ticket_price_theater` FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_price_movie` FOREIGN KEY (`movie_id`) REFERENCES `Movies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_ticket_price_type_seat` (`type_seat`),
  INDEX `idx_ticket_price_type_movie` (`type_movie`),
  INDEX `idx_ticket_price_day_type` (`day_type`),
  INDEX `idx_ticket_price_theater` (`theater_id`),
  INDEX `idx_ticket_price_dates` (`start_date`, `end_date`),
  INDEX `idx_ticket_price_movie_id` (`movie_id`),
  INDEX `idx_ticket_price_composite` (`type_seat`, `type_movie`, `day_type`, `movie_id`, `theater_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17) Promotions
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `image` VARCHAR(500) NULL COMMENT 'URL ảnh khuyến mãi',
  `discountType` ENUM('PERCENT','AMOUNT') NOT NULL DEFAULT 'PERCENT',
  `discountValue` DECIMAL(10,2) NOT NULL,
  `startAt` DATETIME NULL,
  `endAt` DATETIME NULL,
  `status` ENUM('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `channelEmail` BIT(1) NOT NULL DEFAULT b'0',
  `channelInApp` BIT(1) NOT NULL DEFAULT b'1',
  `usageLimit` INT NULL,
  `perUserLimit` INT NULL,
  `isPublic` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Mã công khai, hiển thị gợi ý ở màn thanh toán',
  `active` BIT(1) NOT NULL DEFAULT b'1',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_promotions_code` (`code`),
  INDEX `idx_promotions_status` (`status`),
  INDEX `idx_promotions_active` (`active`),
  INDEX `idx_promotions_start_at` (`startAt`),
  INDEX `idx_promotions_end_at` (`endAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18) Payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `payment_method` ENUM('VIETQR','VNPAY','VIETTEL_PAY','SEAPAY','PAYPAL','CASH','POS','MOMO') NOT NULL,
  `payment_status` ENUM('PENDING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `payment_time` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo payment, dùng để track timeout cho seat locking',
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `transaction_id` VARCHAR(255) NULL,
  `promotion_id` INT NULL COMMENT 'ID mã khuyến mãi (nếu có)',
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_payments_booking_id` (`booking_id`),
  INDEX `idx_payments_status` (`payment_status`),
  INDEX `idx_payments_method` (`payment_method`),
  INDEX `idx_payments_transaction_id` (`transaction_id`),
  INDEX `idx_payments_payment_time` (`payment_time`),
  INDEX `idx_payments_created_at` (`created_at`),
  INDEX `idx_payments_promotion_id` (`promotion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19) user_promotions (composite PK)
CREATE TABLE IF NOT EXISTS `user_promotions` (
  `user_id` INT NOT NULL,
  `promotion_id` INT NOT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`,`promotion_id`),
  CONSTRAINT `fk_user_promotion_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_promotion_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_user_promotions_user_id` (`user_id`),
  INDEX `idx_user_promotions_promotion_id` (`promotion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20) OTP Verifications
CREATE TABLE IF NOT EXISTS `otp_verifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `otp_code` VARCHAR(12) NOT NULL,
  `purpose` ENUM('REGISTER', 'RESET_PASSWORD', 'CHANGE_EMAIL', 'ADMIN_RESET_CODE') NOT NULL DEFAULT 'REGISTER',
  `expires_at` DATETIME NOT NULL,
  `is_used` BIT(1) NOT NULL DEFAULT b'0',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_email` (`email`),
  INDEX `idx_otp_code` (`otp_code`),
  INDEX `idx_otp_purpose` (`purpose`),
  INDEX `idx_otp_expires_at` (`expires_at`),
  INDEX `idx_otp_is_used` (`is_used`),
  INDEX `idx_otp_email_purpose` (`email`, `purpose`, `is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21) Password Reset Requests (for employee password reset with admin approval)
CREATE TABLE IF NOT EXISTS `password_reset_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `reset_code` VARCHAR(12) NULL COMMENT 'Mã 8 ký tự được gửi khi admin duyệt',
  `expires_at` DATETIME NULL COMMENT 'Thời gian hết hạn của reset_code',
  `approved_by` INT NULL COMMENT 'ID admin đã duyệt yêu cầu',
  `approved_at` DATETIME NULL COMMENT 'Thời gian admin duyệt',
  `completed_at` DATETIME NULL COMMENT 'Thời gian nhân viên hoàn tất đặt lại mật khẩu',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_reset_email` (`email`),
  INDEX `idx_reset_status` (`status`),
  INDEX `idx_reset_code` (`reset_code`),
  INDEX `idx_reset_expires_at` (`expires_at`),
  INDEX `idx_reset_approved_by` (`approved_by`),
  INDEX `idx_reset_created_at` (`created_at`),
  INDEX `idx_reset_email_status` (`email`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Thêm foreign key constraint cho users.theater_id (phải thêm sau khi bảng Theaters đã được tạo)
-- Kiểm tra xem constraint đã tồn tại chưa trước khi thêm
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'fk_users_theater'
);

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE `users` ADD CONSTRAINT `fk_users_theater` FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 21) Chat Conversations
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

-- 22) Chat Messages
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `staff_id` INT NULL COMMENT 'ID nhân viên (nếu tin nhắn từ staff)',
  `theater_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `image_url` VARCHAR(500) NULL,
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

-- 23) Email Logs (for tracking sent emails)
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `to` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `type` VARCHAR(50) NULL,
  `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `error` TEXT NULL,
  `message_id` VARCHAR(255) NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` JSON NULL,
  INDEX `idx_to` (`to`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- 1) Insert Roles
INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'ROLE_ADMIN'),
(2, 'ROLE_USER'),
(3, 'ROLE_EMPLOYEE')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);


-- Email: admin@cinema.com
-- Password: admin123

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `avatar`, `phone`, `address`, `created_at`, `updated_at`, `status`) VALUES
(1, 'Admin', 'System', 'admin@cinema.com', '$2b$10$d.on067W8auJwc6RvmDAdeMfWL3LL73O0p5qY9hxEDnPtwkjYoCB6', NULL, NULL, NULL, NOW(), NULL, 'ACTIVE')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- 3) Assign ROLE_ADMIN to admin user
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1)
ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);
