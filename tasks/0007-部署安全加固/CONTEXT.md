# CONTEXT — 0007 部署安全加固

## 问题来源
审计发现 S7：JWT Secret 使用默认值，生产环境存在 token 伪造风险。

## 验收标准
- AC-01：启动时检测 JWT_SECRET 环境变量，未设置则拒绝启动
- AC-02：数据库密码通过环境变量注入，不硬编码
- AC-03：生产模式下关闭 debug 日志（gin mode=release）
- AC-04：管理后台默认密码强制首次修改
- AC-05：提供 `.env.example` 示例文件

## 优先级
P0 — 上线前必须完成
