# TODO — 0002 用户预约

## 后端 ✅

- [x] Order、OrderRental Model（`model/order.go` + `model/order_rental.go`）
- [x] RentalItem Model（`model/rental_item.go`）
- [x] User Model + 会员折扣（`model/user.go`）
- [x] OrderRepository（创建订单事务、查询、超时取消）
- [x] UserRepository（用户 CRUD）
- [x] 价格计算 Service（团费 + 租赁费 - 会员折扣 - 余额抵扣）
- [x] 订单创建 Service（含名额锁定、重复校验）
- [x] 订单查询/取消 API
- [x] 支付回调接口（占位，待接入微信支付）
- [x] 线路列表/详情 API（`handler/route.go`）
- [x] 租赁项列表 API（`handler/rental.go`）
- [x] 路由注册 + main.go 集成
- [ ] 微信支付集成（需 appid + 商户号）
- [ ] 超时自动取消定时任务（需 cron 调度）
- [ ] 单元测试

## 小程序前端 ✅

- [x] 预约页面（选人数 → 选租赁 → 填信息 → 确认支付）
- [x] 订单列表页（状态筛选 + 分页 + 下拉刷新）
- [x] 订单详情页（状态展示 + 费用明细 + 取消/支付）
- [x] 订单 + 租赁项 + 线路 API 封装
- [ ] 支付调用（待微信支付接入）
