<template>
  <view class="page">
    <!-- 顶部用户信息 -->
    <view class="header">
      <view class="status-bar">
        <text class="time">9:41</text>
        <text class="icons">📶 🔋</text>
      </view>
      <view class="user-row">
        <view class="user-avatar">{{ user.avatar }}</view>
        <view class="user-info">
          <text class="user-name">{{ user.nickname }}</text>
          <text class="user-meta">{{ user.memberLevel }} · 余额 ¥{{ user.balance.toFixed(2) }}</text>
        </view>
        <view class="settings-btn">⚙️</view>
      </view>

      <!-- 会员卡 -->
      <view class="member-card">
        <view class="member-card-bg">🐟</view>
        <text class="member-level">{{ user.memberLevel }}</text>
        <text class="member-balance">¥{{ user.balance.toFixed(2) }}</text>
        <text class="member-meta">累计充值 ¥{{ user.totalRecharge }} · {{ (user.discount * 10).toFixed(0) }}折优惠</text>
      </view>
    </view>

    <!-- 我的门店 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">🏪 我的门店</text>
        <text class="section-link" @tap="goShops">管理 →</text>
      </view>

      <view
        class="shop-card"
        v-for="shop in userShops"
        :key="shop.merchantId"
        :class="{ primary: shop.isPrimary }"
        @tap="goStoreDetail(shop.merchantId)"
      >
        <view class="shop-icon" :style="{ background: shop.gradient }">{{ shop.ownerAvatar }}</view>
        <view class="shop-info">
          <view class="shop-name-row">
            <text class="shop-name">{{ shop.name }}</text>
            <text class="shop-badge" v-if="shop.isPrimary">⭐ 主场店</text>
          </view>
          <text class="shop-meta">
            距您{{ shop.distance }}km ·
            {{ shop.isPrimary ? '本周' + shop.weeklyActivities + '个活动' : '上次访问 ' + shop.lastVisit }}
          </text>
        </view>
        <text class="shop-arrow">→</text>
      </view>
    </view>

    <!-- 快捷功能 -->
    <view class="menu-card">
      <view class="menu-item" @tap="goOrders">
        <text class="menu-icon">📋</text>
        <text class="menu-label">我的订单</text>
        <text class="menu-arrow">全部 →</text>
      </view>
      <view class="menu-item" @tap="goRecharge">
        <text class="menu-icon">💳</text>
        <text class="menu-label">会员充值</text>
        <text class="menu-arrow">去充值 →</text>
      </view>
      <view class="menu-item" @tap="goInvite">
        <text class="menu-icon">🎁</text>
        <text class="menu-label">邀请好友</text>
        <text class="menu-accent">赚 ¥20</text>
      </view>
      <view class="menu-item" @tap="callService">
        <text class="menu-icon">📞</text>
        <text class="menu-label">联系客服</text>
        <text class="menu-arrow">→</text>
      </view>
      <view class="menu-item" @tap="goDiscovery">
        <text class="menu-icon">🔍</text>
        <text class="menu-label">发现新门店</text>
        <text class="menu-arrow">→</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { mockUser, mockUserShops } from '@/mock/data.js'

const user = ref(mockUser)
const userShops = ref(mockUserShops)

const goOrders = () => uni.navigateTo({ url: '/pages/order/list' })
const goRecharge = () => uni.navigateTo({ url: '/pages/member/index' })
const goInvite = () => uni.navigateTo({ url: '/pages/invite/index' })
const callService = () => uni.makePhoneCall({ phoneNumber: '138-XXXX-8888' })
const goDiscovery = () => uni.navigateTo({ url: '/pages/discovery/index' })
const goShops = () => {}
const goStoreDetail = (id) => uni.navigateTo({ url: `/pages/store/detail?id=${id}` })
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.page {
  background: $bg-page;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 顶部 */
.header {
  background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%);
  padding-bottom: 60rpx;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: white;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 28rpx;
  padding: 32rpx 40rpx 0;
}

.user-avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
}

.user-info { flex: 1; }

.user-name {
  color: white;
  font-size: 40rpx;
  font-weight: 700;
  display: block;
}

.user-meta {
  color: rgba(255, 255, 255, 0.7);
  font-size: 26rpx;
  margin-top: 8rpx;
  display: block;
}

.settings-btn {
  font-size: 40rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* 会员卡 */
.member-card {
  margin: 32rpx 32rpx 0;
  background: linear-gradient(135deg, #F4A261 0%, #E76F51 100%);
  border-radius: 32rpx;
  padding: 32rpx;
  position: relative;
  overflow: hidden;
}

.member-card-bg {
  position: absolute;
  right: -20rpx;
  top: -20rpx;
  font-size: 120rpx;
  opacity: 0.2;
}

.member-level {
  color: rgba(255, 255, 255, 0.8);
  font-size: 22rpx;
  display: block;
}

.member-balance {
  color: white;
  font-size: 56rpx;
  font-weight: 800;
  margin-top: 8rpx;
  display: block;
}

.member-meta {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  margin-top: 8rpx;
  display: block;
}

/* Section */
.section {
  padding: 32rpx 32rpx 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
}

.section-link {
  font-size: 26rpx;
  color: $primary;
}

/* 门店卡片 */
.shop-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;

  &.primary {
    border-left: 8rpx solid $primary;
  }
}

.shop-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
}

.shop-info { flex: 1; }

.shop-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.shop-name {
  font-size: 30rpx;
  font-weight: 600;
}

.shop-badge {
  font-size: 20rpx;
  background: $primary-bg;
  color: $primary;
  padding: 4rpx 12rpx;
  border-radius: $radius-full;
}

.shop-meta {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.shop-arrow {
  font-size: 28rpx;
  color: $text-tertiary;
}

/* 菜单 */
.menu-card {
  margin: 32rpx;
  background: $bg-card;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 2rpx solid #F0F0F0;

  &:last-child { border-bottom: none; }
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.menu-label {
  font-size: 30rpx;
  flex: 1;
}

.menu-arrow {
  font-size: 26rpx;
  color: $text-tertiary;
}

.menu-accent {
  font-size: 26rpx;
  color: $accent;
  font-weight: 600;
}
</style>
