-- ============================================================
-- yule-go 数据库初始化脚本
-- 版本: 001_init
-- 日期: 2026-05-05
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------
-- 1. 用户表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `openid`         VARCHAR(64) NOT NULL UNIQUE COMMENT '微信 openid',
  `unionid`        VARCHAR(64) DEFAULT NULL COMMENT '微信 unionid',
  `nickname`       VARCHAR(64) DEFAULT '' COMMENT '昵称',
  `avatar`         VARCHAR(512) DEFAULT '' COMMENT '头像 URL',
  `phone`          VARCHAR(20) DEFAULT NULL COMMENT '手机号（加密存储）',
  `member_level`   TINYINT UNSIGNED DEFAULT 0 COMMENT '会员等级：0=普通 1=银卡 2=金卡 3=钻石',
  `balance`        DECIMAL(10,2) DEFAULT 0.00 COMMENT '账户余额（元）',
  `total_recharge` DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计充值金额',
  `invite_code`    VARCHAR(16) NOT NULL UNIQUE COMMENT '邀请码（6位随机）',
  `invited_by`     BIGINT UNSIGNED DEFAULT NULL COMMENT '邀请人 ID',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_phone` (`phone`),
  INDEX `idx_invite_code` (`invite_code`),
  INDEX `idx_invited_by` (`invited_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- -----------------------------------------------------------
-- 2. 线路表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `routes` (
  `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL COMMENT '线路名称',
  `type`         VARCHAR(20) NOT NULL COMMENT '类型：fishing/camping/family/senior',
  `price`        DECIMAL(10,2) NOT NULL COMMENT '成人价格（元）',
  `child_price`  DECIMAL(10,2) DEFAULT 0.00 COMMENT '儿童价格（元）',
  `description`  TEXT COMMENT '线路描述',
  `itinerary`    TEXT COMMENT '行程安排（JSON 格式）',
  `includes`     TEXT COMMENT '包含项目（JSON 数组）',
  `cover_image`  VARCHAR(512) DEFAULT '' COMMENT '封面图 URL',
  `max_slots`    INT UNSIGNED DEFAULT 30 COMMENT '每团最大人数',
  `status`       TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0=下架 1=上架',
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线路表';

-- -----------------------------------------------------------
-- 3. 团期表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schedules` (
  `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `route_id`     BIGINT UNSIGNED NOT NULL COMMENT '线路 ID',
  `trip_date`    DATE NOT NULL COMMENT '出行日期',
  `max_slots`    INT UNSIGNED NOT NULL COMMENT '本团最大人数',
  `booked_slots` INT UNSIGNED DEFAULT 0 COMMENT '已报名人数',
  `guide_name`   VARCHAR(64) DEFAULT '' COMMENT '领队姓名',
  `guide_phone`  VARCHAR(20) DEFAULT '' COMMENT '领队电话',
  `status`       TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0=取消 1=报名中 2=已满 3=已出发 4=已完成',
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_route_date` (`route_id`, `trip_date`),
  INDEX `idx_trip_date` (`trip_date`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团期表';

-- -----------------------------------------------------------
-- 4. 订单表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id`               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_no`         VARCHAR(32) NOT NULL UNIQUE COMMENT '订单编号',
  `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `schedule_id`      BIGINT UNSIGNED NOT NULL COMMENT '团期 ID',
  `adults`           INT UNSIGNED DEFAULT 1 COMMENT '成人数',
  `children`         INT UNSIGNED DEFAULT 0 COMMENT '儿童数',
  `trip_fee`         DECIMAL(10,2) NOT NULL COMMENT '团费小计',
  `rental_fee`       DECIMAL(10,2) DEFAULT 0.00 COMMENT '租赁费小计',
  `discount_amount`  DECIMAL(10,2) DEFAULT 0.00 COMMENT '会员折扣金额',
  `balance_used`     DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额抵扣金额',
  `total_amount`     DECIMAL(10,2) NOT NULL COMMENT '实付金额',
  `contact_name`     VARCHAR(64) NOT NULL COMMENT '联系人姓名',
  `contact_phone`    VARCHAR(20) NOT NULL COMMENT '联系人电话',
  `payment_status`   TINYINT UNSIGNED DEFAULT 0 COMMENT '支付状态：0=未支付 1=已支付 2=已退款',
  `payment_time`     DATETIME DEFAULT NULL COMMENT '支付时间',
  `wx_transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '微信支付交易号',
  `status`           TINYINT UNSIGNED DEFAULT 0 COMMENT '订单状态：0=待支付 1=已确认 2=已出行 3=已完成 4=已取消 5=已退款',
  `cancel_reason`    VARCHAR(255) DEFAULT '' COMMENT '取消原因',
  `remark`           VARCHAR(500) DEFAULT '' COMMENT '备注',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_schedule_id` (`schedule_id`),
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- -----------------------------------------------------------
-- 5. 装备租赁项表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rental_items` (
  `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL COMMENT '装备名称',
  `price_per_day` DECIMAL(10,2) NOT NULL COMMENT '每日租金（元）',
  `stock`        INT UNSIGNED DEFAULT 10 COMMENT '库存数量',
  `status`       TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0=下架 1=上架',
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='装备租赁项';

-- -----------------------------------------------------------
-- 6. 订单租赁明细表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_rentals` (
  `id`             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id`       BIGINT UNSIGNED NOT NULL COMMENT '订单 ID',
  `rental_item_id` BIGINT UNSIGNED NOT NULL COMMENT '租赁项 ID',
  `quantity`       INT UNSIGNED DEFAULT 1 COMMENT '数量',
  `unit_price`     DECIMAL(10,2) NOT NULL COMMENT '单价',
  `subtotal`       DECIMAL(10,2) NOT NULL COMMENT '小计',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  FOREIGN KEY (`rental_item_id`) REFERENCES `rental_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单租赁明细';

-- -----------------------------------------------------------
-- 7. 充值记录表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recharges` (
  `id`               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `amount`           DECIMAL(10,2) NOT NULL COMMENT '充值金额',
  `gift_amount`      DECIMAL(10,2) DEFAULT 0.00 COMMENT '赠送金额',
  `payment_status`   TINYINT UNSIGNED DEFAULT 0 COMMENT '支付状态：0=未支付 1=已支付',
  `wx_transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '微信支付交易号',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值记录';

-- -----------------------------------------------------------
-- 8. 裂变记录表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referrals` (
  `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `inviter_id`        BIGINT UNSIGNED NOT NULL COMMENT '邀请人 ID',
  `invitee_id`        BIGINT UNSIGNED NOT NULL COMMENT '被邀请人 ID',
  `invitee_order_id`  BIGINT UNSIGNED DEFAULT NULL COMMENT '触发奖励的订单 ID',
  `reward_amount`     DECIMAL(10,2) DEFAULT 20.00 COMMENT '邀请人奖励金额',
  `new_user_discount` DECIMAL(10,2) DEFAULT 15.00 COMMENT '新用户首单立减金额',
  `status`            TINYINT UNSIGNED DEFAULT 0 COMMENT '状态：0=待触发 1=已奖励 2=已失效',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_invitee` (`invitee_id`),
  INDEX `idx_inviter_id` (`inviter_id`),
  FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`invitee_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='裂变记录';

-- -----------------------------------------------------------
-- 9. 管理员表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id`            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username`      VARCHAR(64) NOT NULL UNIQUE COMMENT '用户名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `role`          VARCHAR(20) DEFAULT 'admin' COMMENT '角色：super_admin/admin/staff',
  `status`        TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0=禁用 1=启用',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ============================================================
-- 初始数据
-- ============================================================

-- 初始线路（四大产品）
INSERT INTO `routes` (`name`, `type`, `price`, `child_price`, `description`, `max_slots`) VALUES
('成人钓友单日垂钓团', 'fishing', 128.00, 0.00, '周边水库专属钓点，专人带队一站式出行', 20),
('垂钓+露营一日套餐', 'camping', 198.00, 0.00, '全套装备，拎包出行，垂钓露营双重体验', 15),
('亲子出游套餐', 'family', 198.00, 68.00, '趣味钓鱼+户外游戏+露营野餐，高质量亲子陪伴', 10),
('退休专属慢游单日团', 'senior', 98.00, 0.00, '慢节奏、少步行、休闲观光+轻度垂钓康养出行', 25),
('野钓探险团', 'wild_fishing', 158.00, 0.00, '自然水域野钓体验，向导带队探索秘境钓点', 12);

-- 初始租赁项
INSERT INTO `rental_items` (`name`, `price_per_day`, `stock`) VALUES
('鱼竿套装', 30.00, 30),
('帐篷', 50.00, 15),
('天幕', 40.00, 10),
('折叠桌椅', 25.00, 20);

-- 初始管理员（密码: admin123，首次登录后请立即修改）
-- 密码哈希使用 argon2id，参数：m=65536,t=3,p=2,salt=16字节零值
INSERT INTO `admins` (`username`, `password_hash`, `role`) VALUES
('admin', '$argon2id$v=19$m=65536,t=3,p=2$AAAAAAAAAAAAAAAAAAAAAA$DOnSQ1mnoOT0UKFvU/tdiQnZuMIrE+AXDT4nrUKynO4', 'super_admin');

SET FOREIGN_KEY_CHECKS = 1;
