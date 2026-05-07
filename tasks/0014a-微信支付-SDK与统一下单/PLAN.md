# PLAN — 微信支付 SDK + 统一下单

## Step 1: 配置
- config/config.go 新增 WechatPay 配置

## Step 2: 支付 SDK
- 创建 pkg/wechat/pay.go — 签名 + 统一下单

## Step 3: 订单支付接口
- handler/order.go 新增下单后调用支付
- service/order.go 支付单创建逻辑

## Step 4: 小程序端
- api/order.js 支付调用
