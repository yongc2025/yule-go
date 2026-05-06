# TODO — 订单状态机 + 退款

- [ ] 1. 修改 model/order.go — 扩展状态常量 + 状态机校验
- [ ] 2. 创建 service/refund.go — 退款规则引擎
- [ ] 3. 修改 service/order.go — Cancel 增加退款规则
- [ ] 4. 新增 handler/order.go — AdminRefund 接口
- [ ] 5. 新增 scheduler 任务 — 团期次日自动完成
- [ ] 6. 管理后台：退款审核 UI
- [ ] 7. 小程序端：退款申请入口
