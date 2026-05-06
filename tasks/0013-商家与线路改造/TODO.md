# TODO — 商家与线路改造

- [ ] 1. 数据库迁移：创建 merchants 表 + 初始化渔乐商家
- [ ] 2. 数据库变更：routes 新增字段（merchant_id, fishing_spot_id, departure_point 等）
- [ ] 3. 数据库变更：schedules 新增 merchant_id
- [ ] 4. 数据库变更：rental_items 新增 merchant_id
- [ ] 5. 数据库变更：admins 新增 merchant_id
- [ ] 6. Model：创建 model/merchant.go
- [ ] 7. Model：修改 model/route.go（新增字段）
- [ ] 8. Repository：创建 repository/merchant.go + 修改 route/schedule 相关
- [ ] 9. Service：修改 service/route.go（关联钓场、取消政策）
- [ ] 10. Handler：修改 handler/route.go + handler/admin_route.go
- [ ] 11. 管理后台前端：RouteList.vue（线路 CRUD，关联钓场选择）
- [ ] 12. 小程序前端：线路详情页（GetYourGuide 结构）
- [ ] 13. 小程序前端：线路列表（支持筛选）
