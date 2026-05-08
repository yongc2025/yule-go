# 0037 团期变更通知 — 执行计划

## Step 1: 云函数 — 团期变更
- schedules 云函数新增 update/cancel action
- 变更时记录变更类型（date/location/cancel）
- 取消时自动触发退款

## Step 2: 通知模块
- 创建 `cloudfunctions/notify/index.js`
- 发送微信订阅消息
- 消息模板：团期变更通知、团期取消通知

## Step 3: 订阅消息授权
- 用户下单时引导授权订阅消息
- 存储授权状态

## Step 4: 团期编辑页增强
- 团期管理页支持编辑（日期/名额/地点）
- 取消团期二次确认 + 自动退款提示
