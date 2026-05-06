# TODO — 0009 金额精度优化

- [x] 创建 pkg/util/money.go，提供 RoundToCent 函数
- [x] 订单 Service 金额计算增加 RoundToCent
- [x] 充值 Service 金额计算增加 RoundToCent
- [x] 裂变 Service 金额计算增加 RoundToCent
- [x] 前端金额显示统一 toFixed(2)（已确认现有代码均使用 toFixed(2)）
