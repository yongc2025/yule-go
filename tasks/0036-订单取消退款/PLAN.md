# 0036 订单取消退款 — 执行计划

## Step 1: 退款配置模块
- 创建 refund policy 配置（预留比例调整结构）

## Step 2: 云函数 — 退款
- orders 云函数新增 `refund` action
- 调用 cloud.cloudPay.refund() 或模拟退款
- 更新订单状态为 cancelled
- 归还团期名额

## Step 3: 小程序端 — 取消订单
- 订单详情页新增「申请退款」按钮
- 二次确认弹窗
- 调用退款云函数
- 显示退款结果

## Step 4: 管理后台 — 退款记录
- admin 订单列表显示退款状态
- 退款金额展示
