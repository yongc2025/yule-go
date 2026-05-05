# TODO — 0001 团期管理

## 后端

- [x] 创建 schedules 表迁移脚本（`migrations/001_init.sql`）— 已在 Phase 0 完成
- [x] 定义 Schedule Model（`src/server/model/schedule.go`）
- [x] 实现 ScheduleRepository（`src/server/repository/schedule.go`）
- [x] 实现 ScheduleService（`src/server/service/schedule.go`）
- [x] 实现 ScheduleHandler（`src/server/handler/schedule.go`）
- [x] 注册路由（`src/server/router/schedule.go`）
- [ ] 本地编译验证（`go mod tidy && go build`）
- [ ] API 测试

## 管理后台前端

- [ ] 团期列表页
- [ ] 创建团期表单
- [ ] 编辑团期表单
- [ ] 取消团期确认

## 小程序前端

- [ ] 团期列表页（按周）
- [ ] 团期卡片组件
