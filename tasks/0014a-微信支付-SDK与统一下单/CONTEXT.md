# Task 0014a — 微信支付：SDK 与统一下单

## 用户故事
用户下单后需要调起微信支付完成付款。

## 验收标准
- [ ] AC-01: 创建 `pkg/wechat/pay.go` — 微信支付 SDK 封装（签名、验签、请求）
- [ ] AC-02: 订单创建后调用微信支付统一下单 API，返回小程序支付参数
- [ ] AC-03: 小程序端调用 wx.requestPayment() 完成支付

## 依赖：0011a（用户登录）

## 技术要点
- 微信支付 V3 API（RSA 签名）
- 统一下单：POST /v3/pay/transactions/jsapi
- 配置：mchid、serial_no、api_v3_key、private_key
