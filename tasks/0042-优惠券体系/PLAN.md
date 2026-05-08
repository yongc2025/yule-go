# 0042 优惠券体系 — 执行计划

## Step 1: 数据模型
- 创建 coupons 集合
- 索引：openid + status + expireAt

## Step 2: coupons 云函数
- list：查询我的优惠券（可用/已用/过期）
- grant：发放优惠券（内部调用，校验每人限领数）
- use：标记券为已使用（下单时调用）

## Step 3: 自动发放逻辑
- login 云函数：新用户注册时自动发放新人券
- orders 云函数：支付成功回调时发放复购券
- referral 云函数：绑定邀请关系时发放邀请券

## Step 4: 优惠券列表页
- 创建 pages/coupons/list.js/wxml/wxss
- Tab 切换：可用/已用/过期
- 券卡片展示（面额/类型/有效期/使用条件）

## Step 5: 我的页集成
- 优惠券入口 + 可用数量角标
