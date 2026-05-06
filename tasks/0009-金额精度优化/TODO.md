# TODO — 0009 金额精度优化

- [ ] 创建 pkg/util/money.go，提供 RoundToCent 函数
- [ ] 订单 Service 金额计算增加 RoundToCent
- [ ] 充值 Service 金额计算增加 RoundToCent
- [ ] 裂变 Service 金额计算增加 RoundToCent
- [ ] 前端金额显示统一 toFixed(2)
