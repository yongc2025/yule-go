# TODO — 微信支付

- [ ] 1. 创建 pkg/wechat/pay.go — 微信支付客户端
- [ ] 2. 创建 pkg/wechat/notify.go — 回调验签
- [ ] 3. 修改 service/order.go — Create 后调用统一下单
- [ ] 4. 修改 handler/order.go — PaymentCallback 标准 V3 验签
- [ ] 5. 新增 service/order.go — Refund（退款逻辑）
- [ ] 6. 修改 service/member.go — Recharge 调用统一下单
- [ ] 7. 小程序端：支付流程
- [ ] 8. 小程序端：充值支付
- [ ] 9. 配置文件增加微信支付商户号/证书
