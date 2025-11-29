
USE `cinema_dev`;


ALTER TABLE `Movies` 
ADD COLUMN `rating_warning` TEXT NULL 
COMMENT 'Cảnh báo yêu cầu của phim (ví dụ: PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+))'
AFTER `end_date`;


