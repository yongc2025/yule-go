# TODO — 核销流程

- [ ] 1. 数据库迁移：创建 checkins 表
- [ ] 2. 数据库变更：orders 表新增 checkin_code / checked_in_at 字段
- [ ] 3. Model 层：创建 model/checkin.go
- [ ] 4. Repository 层：创建 repository/checkin.go
- [ ] 5. Service 层：创建 service/checkin.go（核销码生成、核销校验、统计）
- [ ] 6. Handler 层：创建 handler/checkin.go（获取核销码、扫码核销、手动核销、统计）
- [ ] 7. Router 层：创建 router/checkin.go
- [ ] 8. 修改 service/order.go — 支付成功后生成核销码
- [ ] 9. 小程序端：订单详情页增加核销码/二维码展示
- [ ] 10. 管理后台：核销页面（团期选择 + 扫码 + 手动输入 + 统计）
- [ ] 11. 定时任务：团期结束后核销码过期
