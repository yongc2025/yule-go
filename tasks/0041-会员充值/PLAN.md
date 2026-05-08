# 0041 会员充值 — 执行计划

## Step 1: 数据模型
- users 集合扩展：balance, memberLevel, totalRecharge 字段
- 创建 recharges 集合

## Step 2: users 云函数扩展
- 新增 recharge action（模拟充值：写入余额+等级+记录+赠送券）
- 新增 rechargeList action（充值记录查询）
- getProfile 扩展返回余额/等级

## Step 3: 充值中心页面
- 创建 pages/member/recharge.js/wxml/wxss
- 三档充值卡片（价格/权益/推荐标签）
- 充值后弹窗确认

## Step 4: 我的页集成
- 余额+等级展示卡片
- 充值入口
