# PLAN — 0001 团期管理

## 执行计划

### 阶段 1：数据库层
1. 创建 schedules 表迁移脚本
2. 定义 Schedule GORM Model
3. 实现 ScheduleRepository（CRUD）

### 阶段 2：后端 API
1. 定义路由：`/api/v1/admin/schedules`（CRUD）
2. 实现 Handler（入参校验）
3. 实现 Service（业务逻辑：日期校验、去重、状态管理）
4. 实现小程序端 API：`/api/v1/schedules`（列表查询）

### 阶段 3：管理后台前端
1. 团期列表页（表格 + 筛选）
2. 创建/编辑团期弹窗
3. 取消团期确认

### 阶段 4：小程序前端
1. 团期列表页（按周展示）
2. 团期卡片组件（显示剩余名额）

## 验证步骤

1. `POST /api/v1/admin/schedules` 创建团期 → 返回 200
2. `GET /api/v1/admin/schedules` 查看列表 → 包含新创建的团期
3. `GET /api/v1/schedules?week=xxx` 小程序端查询 → 正确显示
4. 创建重复团期 → 返回错误码
5. 名额设为 1，下单后查询 → 显示已满
