# PLAN — 退款与混合支付

## Step 1: 退款
- pkg/wechat/pay.go 新增 Refund 函数
- service/order.go 退款逻辑
- handler/order.go 退款接口

## Step 2: 混合支付
- service/order.go 修改支付逻辑 — 余额优先扣除

## Step 3: 验证
