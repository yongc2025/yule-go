# CONTEXT — 0009 金额精度优化

## 问题来源
审计发现 M4：全链路使用 float64 处理金额，存在浮点精度风险。

## 当前状态
MySQL 使用 DECIMAL(10,2) 存储，精度有保障。Go 侧 float64 对万元级金额精度足够（~15 位有效数字），但累积计算可能有舍入误差。

## 验收标准
- AC-01：金额计算统一使用 `math.Round` 保留 2 位小数
- AC-02：提供 `RoundToCent` 工具函数
- AC-03：订单创建/取消/充值的金额计算全部经过 RoundToCent
- AC-04：前端显示统一使用 `.toFixed(2)`

## 技术方案
- 方案 A（推荐）：保持 float64，增加 RoundToCent 工具函数
- 方案 B：全链路改用 `shopspring/decimal` 库（改动大）
- 方案 C：存储为 int64 分（改动最大，需迁移数据库）

## 优先级
P1 — 上线前建议完成
