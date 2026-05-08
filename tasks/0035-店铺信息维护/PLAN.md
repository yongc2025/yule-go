# 0035 店铺信息维护 — 执行计划

## Step 1: 云函数 — shop 管理
- 创建 `cloudfunctions/shop/index.js`：update action（管理员更新店铺信息）
- merchants 集合新增字段：description, address, phone, tags[], album[], bossName, bossAvatar, bossBio

## Step 2: 店铺编辑页
- 创建 `pages/admin/shop-edit.js/wxml/wxss/json`
- 表单：店名、Logo、简介、地址、电话、老板信息、特色标签、相册
- 图片上传到云存储

## Step 3: 首页数据源切换
- 首页门店头部从 merchants 集合读取（当前可能是硬编码）

## Step 4: 发现页数据联动
- 发现页门店卡片展示店铺 Logo、简介、标签

## 验证
- 店主编辑店铺信息 → 保存成功
- 首页显示最新店铺信息
- 发现页门店卡片信息正确
