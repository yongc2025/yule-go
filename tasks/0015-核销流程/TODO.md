# TODO — 核销流程

- [ ] 1. 数据库迁移：创建 checkins 表 + orders 新增 checkin_code
- [ ] 2. Model：创建 model/checkin.go
- [ ] 3. Service：创建 service/checkin.go
- [ ] 4. Handler：创建 handler/checkin.go
- [ ] 5. 修改 service/order.go — 支付成功后生成核销码
- [ ] 6. 小程序端：订单详情增加核销码/二维码展示
- [ ] 7. 管理后台：核销页面
- [ ] 8. 定时任务：核销码过期
