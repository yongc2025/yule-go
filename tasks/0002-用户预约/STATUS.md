# STATUS — 0002 用户预约

**当前状态：** 🔵 进行中
**当前步骤：** 后端 + 小程序前端代码完成，待本地编译验证
**重试次数：** 0
**最后更新：** 2026-05-06

## 已完成的工作

### Step 1 — 后端 Model ✅
- `model/order.go` — Order 模型 + 状态机 + 请求/响应结构体
- `model/order_rental.go` — OrderRental 租赁明细模型
- `model/rental_item.go` — RentalItem 装备租赁项模型
- `model/user.go` — User 用户模型 + 会员折扣率

### Step 2 — 后端 Repository ✅
- `repository/order.go` — OrderRepository（创建订单含租赁明细事务、查询、超时取消）
- `repository/user.go` — UserRepository（用户 CRUD）

### Step 3 — 后端 Service ✅
- `service/order.go` — OrderService：
  - 价格计算（团费 + 租赁费 - 会员折扣 - 余额抵扣）
  - 名额锁定（校验团期状态、名额、重复下单）
  - 支付回调（幂等处理）
  - 超时自动取消（15 分钟）

### Step 4 — 后端 Handler + Router ✅
- `handler/order.go` — 订单 Handler（创建、详情、列表、取消、支付回调、管理后台）
- `handler/rental.go` — 租赁项 Handler（列表）
- `handler/route.go` — 线路 Handler（列表、详情）
- `router/order.go` — 订单路由（小程序端 + 管理后台 + 支付回调）
- `router/route.go` — 线路路由
- `main.go` 更新 — 集成全部新路由

### Step 5 — 小程序前端 ✅
- `pages/booking/index.vue` — 预约页面：
  - 团期信息展示
  - 成人/儿童人数选择（亲子团才显示儿童）
  - 装备租赁选择（勾选 + 数量调整）
  - 联系信息填写
  - 余额抵扣开关
  - 实时费用计算（团费 + 租赁费 - 折扣 - 余额）
  - 表单校验 + 提交订单
- `pages/order/list.vue` — 订单列表页：
  - 状态筛选标签（全部/待支付/已确认/已完成/已取消）
  - 订单卡片（线路、日期、人数、金额、状态）
  - 分页加载
  - 下拉刷新
- `pages/order/detail.vue` — 订单详情页：
  - 状态头部（不同颜色渐变）
  - 出行信息、租赁明细、费用明细
  - 订单号复制
  - 取消订单、支付按钮
- `api/order.js` — 订单 + 租赁项 + 线路 API

## 待办

- [ ] 微信支付集成（需 appid + 商户号）
- [ ] 用户微信登录（需 appid + secret）
- [ ] 本地编译验证（需 Go 环境）
