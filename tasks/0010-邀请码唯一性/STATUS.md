# STATUS — 0010 邀请码唯一性

**当前状态：** ✅ 已完成
**优先级：** P2
**完成日期：** 2026-05-06

## 实施记录

### 变更文件
- `service/referral.go` — `GenerateInviteCode` 重构：
  - 原函数改名为 `generateInviteCodeRaw()`（内部使用）
  - 新增 `GenerateUniqueInviteCode(userRepo)` — 生成后查询数据库确认唯一，冲突自动重试（最多 3 次）

### 验证
- `go build` 编译通过 ✅
- 冒烟测试：全部 API 正常响应 ✅

### 备注
- `GenerateUniqueInviteCode` 需注入 `UserRepository`，当前用户创建流程（微信登录）尚未实现，待接入时调用即可
- users 表 invite_code 字段已有 UNIQUE INDEX，数据库层面兜底
