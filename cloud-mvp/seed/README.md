# 云开发初始数据

> 在云开发控制台 → 数据库中，将 `.jsonl` 文件导入对应集合
> 格式为 **JSON Lines**（每行一个 JSON 对象），不是 JSON 数组

---

## 导入顺序

1. `merchants.jsonl` → 导入 `merchants` 集合
2. `admins.jsonl` → 导入 `admins` 集合
3. `activities.jsonl` → 导入 `activities` 集合
4. `schedules.jsonl` → 导入 `schedules` 集合

## 重要提示

- 导入时选择 **JSON 格式**（不是 CSV）
- `_id` 字段会自动生成，JSON 中的 `_id` 可以删掉或保留
- `admins.json` 中的 `openid` 需要你在登录后替换为真实的 openid
  （在云开发控制台 → 数据库 → users 集合中查看）
- `schedules.json` 中的 `activityId` 需要替换为导入 activities 后实际生成的 `_id`

## 快速获取 openid

1. 先部署 login 云函数
2. 用微信开发者工具打开小程序，触发登录
3. 在云开发控制台 → 云函数 → login → 日志中查看返回的 openid
4. 或者在 users 集合中查看新创建的用户记录
