# TODO — 钓场钓位体系

- [ ] 1. 数据库迁移：创建 fishing_spots / spot_grades / fishing_positions / schedule_positions 表
- [ ] 2. 数据库变更：routes 新增 fishing_spot_id，schedules 新增 fishing_spot_id
- [ ] 3. Model 层：创建 model/spot.go（钓场/钓位等级/钓位/库存）
- [ ] 4. Repository 层：创建 repository/spot.go（CRUD + 批量创建 + 库存查询）
- [ ] 5. Service 层：创建 service/spot.go（钓场管理 + 钓位库存生成 + 选位逻辑）
- [ ] 6. Handler 层：创建 handler/spot.go + handler/admin_spot.go
- [ ] 7. Router 层：创建 router/spot.go（小程序端 + 管理后台路由）
- [ ] 8. 修改 service/order.go — 下单时选位 + 锁定库存
- [ ] 9. 修改 service/order.go — 取消时释放钓位库存
- [ ] 10. 修改 service/schedule.go — 创建团期时自动生成钓位库存
- [ ] 11. 管理后台前端：钓场管理页面
- [ ] 12. 管理后台前端：钓位管理页面（等级 + 钓位）
- [ ] 13. 小程序前端：钓场列表页
- [ ] 14. 小程序前端：钓场详情页
- [ ] 15. 小程序前端：钓位选择页（集成到预约流程）
