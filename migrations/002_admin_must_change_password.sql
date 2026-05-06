-- 002: admins 表增加 must_change_password 字段（首次登录强制改密）
ALTER TABLE `admins` ADD COLUMN `must_change_password` tinyint(1) NOT NULL DEFAULT 1 AFTER `password_hash`;

-- 现有管理员标记为需要改密
UPDATE `admins` SET `must_change_password` = 1;
