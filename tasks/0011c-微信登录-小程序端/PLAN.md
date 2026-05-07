# PLAN — 小程序登录流程

## Step 1: 登录 + Token 管理
- 创建 api/auth.js — wx-login API
- 创建 utils/auth.js — token 存储/获取/清除
- 修改 api/index.js — 请求拦截注入 token

## Step 2: 自动登录
- 修改 App.vue — onLaunch 自动登录

## Step 3: 用户中心
- 创建 pages/user/profile.vue
- 注册页面路由

## Step 4: 验证
