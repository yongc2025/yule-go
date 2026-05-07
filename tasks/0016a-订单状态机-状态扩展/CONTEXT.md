# Task 0016a — 订单状态机：状态扩展

## 用户故事
订单需要完整状态流转，支持退款中、已退款、已出行、已完成等状态。

## 验收标准
- [ ] AC-01: 订单状态扩展为 7 个（PENDING/PAID/CANCELLED/REFUNDING/REFUNDED/EN_ROUTE/COMPLETED）
- [ ] AC-02: 状态机校验（非法转换拒绝）
- [ ] AC-03: 团期次日自动完成（scheduler）

## 依赖：0014b

## 技术要点
- 修改现有 order.go 状态常量
- 状态转换矩阵校验
