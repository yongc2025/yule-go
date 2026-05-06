# TODO — 微信支付

- [ ] 1. 创建 `pkg/wechat/pay.go` — 微信支付客户端（统一下单/查询/关闭/退款）
- [ ] 2. 创建 `pkg/wechat/notify.go` — 回调验签 + 解密
- [ ] 3. 修改 `service/order.go` — Create 后调用统一下单，返回支付参数
- [ ] 4. 修改 `handler/order.go` — PaymentCallback 使用标准 V3 验签
- [ ] 5. 新增 `handler/order.go` — PaymentNotify（微信异步通知入口）
- [ ] 6. 新增 `service/order.go` — Refund（退款逻辑 + 微信退款 API 调用）
- [ ] 7. 新增 `handler/order.go` — AdminRefund（管理员退款接口）
- [ ] 8. 修改 `service/member.go` — Recharge 调用统一下单
- [ ] 9. 新增 `handler/member.go` — RechargeNotify（充值支付回调）
- [ ] 10. 新增 `router/order.go` — 支付/退款相关路由
- [ ] 11. 小程序端：支付流程（wx.requestPayment）
- [ ] 12. 小程序端：充值支付流程
- [ ] 13. 配置文件增加微信支付商户号/证书路径
