# 技术栈说明 — yule-go

> 本文档定义项目的技术选型，是 AI 生成代码时的技术约束依据

---

## 后端

| 组件 | 选型 | 版本 | 说明 |
|:---|:---|:---|:---|
| 语言 | Go | 1.21+ | 主力开发语言 |
| Web 框架 | Gin | latest | HTTP 路由 + 中间件 |
| ORM | GORM | v2 | 数据库操作 |
| 数据库 | MySQL | 8.0 | 主数据存储 |
| 缓存 | Redis | 7.x | 会话、缓存、分布式锁 |
| 认证 | JWT | — | 微信登录 + 管理员认证 |
| 日志 | slog | stdlib | Go 标准库结构化日志 |
| 配置 | Viper | latest | YAML 配置文件 + 环境变量 |
| 测试 | testing + testify | stdlib + latest | 单元测试 + 断言库 |

## 前端 — 小程序端

| 组件 | 选型 | 说明 |
|:---|:---|:---|
| 框架 | uni-app + Vue3 | 跨端小程序开发 |
| 状态管理 | Pinia | 轻量级状态管理 |
| UI 组件 | uView / uni-ui | 小程序 UI 库 |
| 请求 | uni.request 封装 | 统一拦截 + 错误处理 |

## 前端 — 管理后台

| 组件 | 选型 | 说明 |
|:---|:---|:---|
| 框架 | Vue3 + Vite | 现代前端构建 |
| UI 组件 | Element Plus | 后台管理 UI |
| 状态管理 | Pinia | 统一状态管理 |
| 路由 | Vue Router 4 | 前端路由 |
| 请求 | Axios | HTTP 客户端 |

## 基础设施

| 组件 | 选型 | 说明 |
|:---|:---|:---|
| 反向代理 | Nginx | SSL 终止 + 路由分发 |
| 容器化 | Docker + Docker Compose | 一键部署 |
| CI/CD | GitHub Actions | 自动化测试 + 部署 |
| 版本控制 | Git | 代码管理 |

## 外部服务

| 服务 | 用途 | 备注 |
|:---|:---|:---|
| 微信支付 V3 | 订单支付、充值 | HTTPS + 回调验签 |
| 微信登录 | 用户认证 | openid + JWT |
| OSS（可选） | 图片存储 | V2 再接入 |

## 目录到技术的映射

```
src/server/     → Go + Gin + GORM
src/web/        → Vue3 + Element Plus + Vite
src/miniprogram/ → uni-app + Vue3
migrations/     → MySQL DDL 脚本
docker/         → Docker Compose 编排
scripts/        → Shell 工具脚本
```
