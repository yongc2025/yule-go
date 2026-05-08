# 0039 退款资金对账 — 执行计划

## Step 1: 退款数据存储
- orders 集合新增字段：refundAmount, refundAt, refundNo, refundReason

## Step 2: 对账查询接口
- orders 云函数新增 stats action（按日/按团期统计）
- 返回支付总额、退款总额、净收入、订单数

## Step 3: admin 财务看板
- admin 新增财务统计页
- 今日/本周/本月收支概览
- 退款订单列表

## Step 4: 对账验证
- 模拟完整支付→退款→对账流程
- 验证金额一致性
