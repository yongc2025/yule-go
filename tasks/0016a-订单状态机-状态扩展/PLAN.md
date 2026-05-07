# PLAN — 订单状态机扩展

## Step 1: Model 更新
- model/order.go — 新增状态常量 + 转换校验

## Step 2: Service 更新
- service/order.go — 状态转换逻辑

## Step 3: 自动完成
- scheduler — 团期次日自动完成
