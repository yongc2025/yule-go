# PLAN — 用户接口与中间件

## Step 1: 认证中间件
- 修改 middleware/auth.go — JWT 校验 + user_id 注入

## Step 2: 用户接口
- 创建 handler/user.go — GET/PUT /api/v1/user/profile
- 创建 router/user.go
- main.go 注册用户路由

## Step 3: 验证
- 带 token 调用 profile 接口
