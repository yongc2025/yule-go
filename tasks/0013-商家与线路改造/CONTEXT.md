# Task 0013 — 商家与线路改造

## 用户故事
作为商家（渔具店），我需要创建线路产品，关联钓场，设置价格和取消政策。

## 验收标准
- [ ] AC-01: `merchants` 表创建，初始化一条渔乐商家记录
- [ ] AC-02: `routes` 表新增 merchant_id / fishing_spot_id / departure_point / highlights / cancel_policy 等字段
- [ ] AC-03: `schedules` 表新增 merchant_id 字段
- [ ] AC-04: `rental_items` 表新增 merchant_id 字段
- [ ] AC-05: `admins` 表新增 merchant_id 字段（区分平台管理员和商家管理员）
- [ ] AC-06: 管理后台线路 CRUD（创建/编辑/上下架，关联钓场）
- [ ] AC-07: 线路详情包含结构化信息（行程安排、费用包含/不包含、取消政策）
- [ ] AC-08: 小程序端线路列表支持按钓场/类型筛选
- [ ] AC-09: 小程序端线路详情页采用 GetYourGuide 信息架构

## 依赖：0012-钓场管理
