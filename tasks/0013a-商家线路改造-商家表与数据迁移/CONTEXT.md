# Task 0013a — 商家线路改造：商家表与数据迁移

## 用户故事
系统需要支持多商家架构，现有数据需要关联到默认商家。

## 验收标准
- [ ] AC-01: 创建 merchants 表（名称、logo、联系人、电话、地址、状态）
- [ ] AC-02: 初始数据插入默认商家
- [ ] AC-03: routes/schedules/rental_items/admins 表新增 merchant_id 字段
- [ ] AC-04: 现有数据批量关联到默认商家

## 依赖：无
