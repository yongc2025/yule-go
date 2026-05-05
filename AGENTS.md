# AGENTS.md — yule-go Agent 行为准则

本文件为 AI Agent 提供项目操作手册与约束清单，确保 Agent 行为可控、可复现。

---

## 0. 会话恢复入口（Session Startup）

**每次新会话，必须按以下顺序读取文件，恢复上下文后才能执行任何任务：**

```
1. AGENTS.md              ← 你正在读的这个文件（行为准则）
2. memory-bank/progress.md ← 当前进度：哪些步骤已完成、哪些进行中
3. memory-bank/architecture.md ← 架构全貌：每个文件的职责
4. tasks/INDEX.md          ← 任务看板：6 大模块的全局状态
5. 定位到当前任务目录 tasks/000X/ → 读取 STATUS.md + TODO.md
```

**Always 规则（写任何代码前必须执行）：**
```
# 写任何代码前必须完整阅读 memory-bank/architecture.md（包含完整数据库结构和文件职责）
# 写任何代码前必须完整阅读 memory-bank/requirements.md（包含完整需求规格）
# 每完成一个重大功能或里程碑后，必须更新 memory-bank/architecture.md 和 memory-bank/progress.md
```

---

## 1. Mission & Scope（目标与边界）

### 项目定位
渔具店周末短途旅行数字化运营系统（Go + Vue3 + uni-app + MySQL + Redis）

### 允许的操作
- 读取、修改 `src/` 下的所有源代码
- 读取、修改 `docs/`、`tasks/`、`memory-bank/` 下的文档
- 执行 `make build`、`make test`、`make run`
- 创建/修改 `migrations/` 下的数据库迁移脚本
- 创建/修改 `scripts/` 下的工具脚本
- 提交符合规范的 commit

### 禁止的操作
- 修改 `AGENTS.md` 的核心规则（除非人工明确要求）
- 删除或覆盖已归档的 task 目录
- 在代码中硬编码密钥、Token 或敏感凭证
- 未经确认的大范围重构
- 修改 `.env` 文件中的生产环境配置

### 敏感区域（禁止自动修改）
- `.env*` — 环境变量
- `docker/` 中的生产配置
- 已完成并归档的 `tasks/` 目录

---

## 2. Memory Bank 规范（记忆银行）

### 目录结构
```
memory-bank/
├── requirements.md        # 需求规格书（= game-design-document.md）
├── tech-stack.md          # 技术栈说明
├── implementation-plan.md # 实施计划（从 tasks/ 汇总的全局路线图）
├── progress.md            # 进度日志（每完成一步必须更新）
└── architecture.md        # 架构说明（每个文件的职责，里程碑后必须更新）
```

### 更新规则
| 触发时机 | 必须更新的文件 |
|:---|:---|
| 完成一个实施步骤 | `progress.md`（记录做了什么） |
| 完成一个里程碑 | `architecture.md`（记录新文件的职责） |
| 需求变更 | `requirements.md` + 对应 `tasks/000X/CONTEXT.md` |
| 技术决策变更 | `tech-stack.md` + `architecture.md` |
| 任务状态变更 | `tasks/000X/STATUS.md` + `tasks/INDEX.md` |

---

## 3. Golden Path（推荐执行路径）

```bash
# 1. 恢复上下文（读 memory-bank + tasks/INDEX.md）

# 2. 定位当前任务
cat tasks/INDEX.md          # 找到第一个"进行中"或"待开始"的任务
cat tasks/000X/STATUS.md    # 确认当前步骤

# 3. 执行实施计划的下一步

# 4. 验证
make test

# 5. 更新进度
# 更新 tasks/000X/STATUS.md
# 更新 memory-bank/progress.md

# 6. 提交
git add -A
git commit -m "feat|fix|docs|chore: scope - summary"
```

---

## 4. 分层架构约束

```
Handler（入参校验 + 响应封装）
    ↓ 调用
Service（业务逻辑 + 事务管理）
    ↓ 调用
Repository（数据库 CRUD + SQL 构建）
    ↓ 依赖
Model（数据结构定义 + GORM 标签）
```

**规则：**
- 上层可以调用下层，下层不能反向依赖上层
- Handler 不允许直接操作数据库
- Service 不允许直接操作 HTTP 请求/响应
- Repository 不允许包含业务逻辑
- 每个函数单一职责，不超过 50 行

---

## 5. 代码规范

### Go
- 遵循 Go 官方风格指南（`gofmt` + `golangci-lint`）
- 错误处理：不吞错误，返回 `fmt.Errorf("xxx: %w", err)`
- 日志：使用 `slog` 或 `zap`，结构化日志
- 配置：环境变量 > 配置文件 > 默认值
- 测试：核心 Service 层必须有单元测试

### 前端（Vue3）
- 组合式 API（`<script setup>`）
- TypeScript 优先
- 组件不超过 300 行

---

## 6. 任务管理规范

### 任务目录结构
```
tasks/000X-任务名/
├── CONTEXT.md   # 需求上下文（用户故事 + 验收标准 + 约束）
├── PLAN.md      # 执行计划（分阶段、可验证）
├── TODO.md      # 待办清单（逐项打勾）
└── STATUS.md    # 状态记录（当前步骤 + 失败原因 + 重试次数）
```

### 状态流转
```
🟡 待开始 → 🔵 进行中 → ✅ 已完成
                  ↓ 失败
              ❌ 失败（重规划）→ 🔵 进行中
                  ↓ 连续 3 次失败
              🔴 致命错误（需人工介入）
```

---

## 7. Commit 规范

```
feat|fix|docs|chore|refactor: scope - summary
```

示例：
- `feat: schedule - add CRUD API`
- `fix: order - correct amount calculation`
- `docs: memory-bank - update progress after task 0001`

---

## 8. 常见坑与修复

| 问题 | 原因 | 修复 |
|:---|:---|:---|
| AI 忘记之前的上下文 | 会话丢失 | 严格执行"会话恢复入口"流程 |
| 代码分层混乱 | Handler 直接操作 DB | 对照分层架构约束审查 |
| 需求理解偏差 | 没读 requirements.md | Always 规则：写代码前必须读 memory-bank |
| 进度不同步 | 忘记更新 progress.md | 每个步骤完成后强制更新 |
| 重复团期创建 | 缺少唯一约束 | `UNIQUE KEY uk_route_date (route_id, trip_date)` |

---

## 9. 文档同步规则

**任何功能/命令/配置/目录变化必须同步更新：**
- `memory-bank/architecture.md` — 文件职责变更
- `memory-bank/progress.md` — 进度变更
- `tasks/000X/STATUS.md` — 任务状态变更
- `tasks/INDEX.md` — 全局看板变更

**不确定的内容用 TODO 标注，不允许猜测。**
