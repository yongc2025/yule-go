# STATUS — 0008 定时任务调度

**当前状态：** ✅ 已完成
**优先级：** P0
**完成时间：** 2026-05-06

## 完成项
- [x] 引入 robfig/cron/v3 依赖
- [x] 创建 scheduler 包（scheduler/scheduler.go）
- [x] 超时订单取消定时任务（每分钟执行，15 分钟超时）
- [x] main.go 启动调度器
- [x] 管理后台手动触发 API（POST /api/v1/admin/orders/cancel-expired）
- [x] 优雅退出处理（SIGINT/SIGTERM 信号）
- [x] handler/scheduler.go 全局调度器实例管理
