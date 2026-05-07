# PLAN — 支付回调与异常处理

## Step 1: 回调接口
- handler/pay_callback.go — POST /api/v1/pay/notify
- 验签 + 解密 + 更新订单状态

## Step 2: 超时关闭
- scheduler 中增加支付超时检查

## Step 3: 掉单补单
- 主动查询接口 handler

## Step 4: 验证
