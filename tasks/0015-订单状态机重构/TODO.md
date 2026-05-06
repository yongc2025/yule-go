# TODO — 订单状态机重构

- [ ] 1. 修改 model/order.go — 扩展状态常量 + 状态机校验函数
- [ ] 2. 创建 service/refund.go — 退款规则引擎（时间计算 + 金额计算）
- [ ] 3. 修改 service/order.go — Cancel 方法增加退款规则校验
- [ ] 4. 新增 service/order.go — AdminRefund（管理员退款审核 + 执行）
- [ ] 5. 修改 handler/order.go — 增加退款相关接口
- [ ] 6. 修改 router/order.go — 增加退款路由
- [ ] 7. 新增 scheduler 任务 — 团期次日自动完成
- [ ] 8. 修改管理后台 OrderList.vue — 增加退款审核 UI
- [ ] 9. 小程序端订单详情 — 增加退款申请入口
- [ ] 10. 测试：覆盖所有状态转换场景
