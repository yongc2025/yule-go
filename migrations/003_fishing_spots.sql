-- 003_fishing_spots.sql
-- 钓场表 + 线路表补充 fishing_spot_id

-- 1. 钓场表
CREATE TABLE IF NOT EXISTS `fishing_spots` (
  `id`             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`           VARCHAR(100) NOT NULL COMMENT '钓场名称',
  `address`        VARCHAR(255) NOT NULL COMMENT '详细地址',
  `latitude`       DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude`      DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  `description`    TEXT COMMENT '钓场介绍',
  `fish_types`     JSON COMMENT '主要鱼种',
  `facilities`     JSON COMMENT '设施列表',
  `images`         JSON COMMENT '图片URL列表',
  `cover_image`    VARCHAR(512) DEFAULT '' COMMENT '封面图',
  `contact_name`   VARCHAR(64) DEFAULT '' COMMENT '联系人',
  `contact_phone`  VARCHAR(20) DEFAULT '' COMMENT '联系电话',
  `business_hours` VARCHAR(50) DEFAULT '' COMMENT '营业时间',
  `status`         TINYINT DEFAULT 1 COMMENT '0=停用 1=营业中',
  `created_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钓场表';

-- 2. 线路表补充 fishing_spot_id（关联钓场）
ALTER TABLE `routes`
  ADD COLUMN `fishing_spot_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联钓场' AFTER `name`,
  ADD INDEX `idx_fishing_spot` (`fishing_spot_id`);
