# 0043 老带新裂变 — 执行计划

## Step 1: 数据模型
- users 扩展：inviteCode, invitedBy 字段
- 创建 referrals 集合

## Step 2: referral 云函数
- getInviteInfo：查询邀请码、邀请记录、累计奖励
- bindInvite：新用户绑定邀请关系（登录时自动调用）
- grantReward：发放邀请奖励（orders 支付成功后调用）

## Step 3: login 云函数改造
- 新用户首次登录时生成唯一邀请码
- 检查是否携带邀请参数，自动绑定关系

## Step 4: 邀请好友页面
- 创建 pages/invite/index.js/wxml/wxss
- 我的邀请码 + 一键复制
- 分享按钮（微信分享/海报生成）
- 邀请记录列表（谁/何时/奖励状态）
- 累计奖励统计

## Step 5: 我的页集成
- 邀请好友入口
