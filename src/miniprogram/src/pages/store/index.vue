<template>
  <view class="page">
    <!-- 顶部品牌区 + 老板信息卡 -->
    <view class="header">
      <view class="status-bar">
        <text class="time">9:41</text>
        <text class="icons">📶 🔋</text>
      </view>

      <!-- 品牌区 -->
      <view class="brand-row">
        <view class="brand-left">
          <view class="brand-icon">🎣</view>
          <view>
            <text class="brand-name">渔乐Go</text>
            <text class="brand-slogan">周末去哪？跟我走！</text>
          </view>
        </view>
        <view class="location-btn">
          <text>📍 芙蓉区 ▼</text>
        </view>
      </view>

      <!-- 老板信息卡 -->
      <view class="owner-card">
        <view class="owner-avatar">👨‍🌾</view>
        <view class="owner-info">
          <view class="owner-name-row">
            <text class="owner-name">老王渔具</text>
            <text class="owner-badge">⭐ 金牌领队</text>
          </view>
          <text class="owner-stats">
            已服务 <text class="highlight">{{ merchant.serviceCount }}</text> 人 ·
            {{ merchant.rating }}分({{ merchant.ratingCount }}条评价) ·
            距您{{ merchant.distance }}km
          </text>
        </view>
        <view class="phone-btn" @tap="callPhone">📞</view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-entry">
      <view class="entry-item" v-for="item in quickEntries" :key="item.label">
        <view class="entry-icon" :style="{ background: item.bg }">{{ item.emoji }}</view>
        <text class="entry-label">{{ item.label }}</text>
      </view>
    </view>

    <!-- 本周活动 -->
    <view class="section">
      <view class="section-header">
        <view>
          <text class="section-title">本周活动</text>
          <text class="section-date">5月9日-10日</text>
        </view>
        <text class="section-link">查看全部 →</text>
      </view>

      <view
        class="activity-card"
        v-for="activity in activities"
        :key="activity.id"
        @tap="goActivityDetail(activity.id)"
      >
        <view class="activity-banner" :style="{ background: activity.gradient }">
          <view class="activity-badge" :class="{ hot: activity.remainingSlots <= 3 }">
            {{ activity.remainingSlots <= 3 ? '🔥 仅剩' + activity.remainingSlots + '位' : '剩余' + activity.remainingSlots + '位' }}
          </view>
          <view class="activity-banner-text">
            <text class="activity-date">{{ activity.date }} {{ activity.dayOfWeek }}</text>
            <text class="activity-name">{{ activity.name }}</text>
          </view>
        </view>
        <view class="activity-content">
          <view class="activity-tags">
            <text class="tag" v-for="tag in activity.tags" :key="tag">{{ tag }}</text>
          </view>
          <view class="activity-bottom">
            <view class="price-row">
              <text class="price">¥{{ activity.price }}</text>
              <text class="price-unit">{{ activity.priceUnit }}</text>
            </view>
            <view class="btn btn-primary btn-sm">立即报名</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 门店信息 -->
    <view class="divider"></view>
    <view class="section">
      <text class="section-title">📍 门店信息</text>
      <view class="store-info-card">
        <view class="store-info-top">
          <view class="store-icon">🏪</view>
          <view>
            <text class="store-name">{{ merchant.name }}</text>
            <text class="store-address">{{ merchant.address }}</text>
          </view>
        </view>
        <view class="store-btns">
          <view class="btn btn-outline btn-sm" style="flex:1" @tap="openMap">🧭 导航过去</view>
          <view class="btn btn-primary btn-sm" style="flex:1" @tap="callPhone">📞 一键拨打</view>
        </view>
      </view>
    </view>

    <!-- 服务承诺 -->
    <view class="section" style="padding-bottom: 40rpx;">
      <view class="promise-card">
        <text class="promise-title">🛡️ 渔乐Go承诺</text>
        <view class="promise-tags">
          <text class="promise-tag">✅ 纯玩无购物</text>
          <text class="promise-tag">✅ 全程领队陪同</text>
          <text class="promise-tag">✅ 装备免费消毒</text>
          <text class="promise-tag">✅ 不满意可退款</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { mockMerchant, mockActivities } from '@/mock/data.js'

const merchant = ref(mockMerchant)
const activities = ref(mockActivities)

const quickEntries = [
  { emoji: '🎯', label: '全部活动', bg: '#D8F3DC' },
  { emoji: '🏕️', label: '露营', bg: '#E8F5E9' },
  { emoji: '👨‍👩‍👧', label: '亲子', bg: '#FFF3E0' },
  { emoji: '👴', label: '慢游', bg: '#F3E5F5' }
]

const callPhone = () => {
  uni.makePhoneCall({ phoneNumber: merchant.value.phone })
}

const openMap = () => {
  uni.openLocation({
    latitude: merchant.value.latitude,
    longitude: merchant.value.longitude,
    name: merchant.value.name,
    address: merchant.value.address
  })
}

const goActivityDetail = (id) => {
  uni.navigateTo({ url: `/pages/activity/detail?id=${id}` })
}
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
  padding-bottom: 32rpx;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: $text-white;
}

.brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40rpx 24rpx;
}

.brand-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.brand-icon {
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.brand-name {
  color: $text-white;
  font-size: 36rpx;
  font-weight: 700;
  display: block;
}

.brand-slogan {
  color: rgba(255, 255, 255, 0.7);
  font-size: 22rpx;
  display: block;
}

.location-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
}

/* 老板信息卡 */
.owner-card {
  margin: 0 32rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 32rpx;
  padding: 28rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.owner-avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #F4A261, #E76F51);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
}

.owner-info {
  flex: 1;
}

.owner-name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.owner-name {
  color: $text-white;
  font-size: 36rpx;
  font-weight: 700;
}

.owner-badge {
  font-size: 20rpx;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
}

.owner-stats {
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  margin-top: 8rpx;
  display: block;

  .highlight {
    color: #F4A261;
    font-weight: 600;
  }
}

.phone-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

/* 快捷入口 */
.quick-entry {
  margin: -16rpx 32rpx 0;
  background: $bg-card;
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: $shadow-md;
  position: relative;
  z-index: 1;
}

.entry-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.entry-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
}

.entry-label {
  font-size: 24rpx;
  color: $text-secondary;
}

/* Section */
.section {
  padding: 32rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
}

.section-date {
  font-size: 24rpx;
  color: $text-tertiary;
  margin-left: 16rpx;
}

.section-link {
  font-size: 26rpx;
  color: $primary;
  font-weight: 500;
}

/* 活动卡片 */
.activity-card {
  background: $bg-card;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
  margin-bottom: 24rpx;
}

.activity-banner {
  height: 280rpx;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 28rpx;
}

.activity-badge {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  font-size: 22rpx;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6rpx 16rpx;
  border-radius: $radius-full;

  &.hot {
    background: $accent;
    color: white;
    font-weight: 600;
  }
}

.activity-banner-text {
  .activity-date {
    color: rgba(255, 255, 255, 0.8);
    font-size: 26rpx;
    display: block;
  }

  .activity-name {
    color: $text-white;
    font-size: 36rpx;
    font-weight: 700;
    margin-top: 4rpx;
    display: block;
  }
}

.activity-content {
  padding: 28rpx;
}

.activity-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.tag {
  font-size: 24rpx;
  background: $bg-page;
  color: $text-secondary;
  padding: 8rpx 20rpx;
  border-radius: $radius-full;
}

.activity-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-row {
  display: flex;
  align-items: baseline;
}

.price {
  font-size: 44rpx;
  font-weight: 800;
  color: $accent;
}

.price-unit {
  font-size: 26rpx;
  color: $text-tertiary;
  margin-left: 4rpx;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  font-weight: 600;
}

.btn-primary {
  background: $primary;
  color: $text-white;
}

.btn-outline {
  background: transparent;
  border: 3rpx solid $primary;
  color: $primary;
}

.btn-sm {
  padding: 16rpx 32rpx;
  font-size: 26rpx;
}

/* 门店信息卡片 */
.store-info-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: $shadow-sm;
  margin-top: 20rpx;
}

.store-info-top {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.store-icon {
  width: 120rpx;
  height: 120rpx;
  background: $primary-bg;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
}

.store-name {
  font-size: 32rpx;
  font-weight: 600;
  display: block;
}

.store-address {
  font-size: 26rpx;
  color: $text-secondary;
  margin-top: 4rpx;
  display: block;
}

.store-btns {
  display: flex;
  gap: 20rpx;
}

.divider {
  height: 16rpx;
  background: $bg-page;
}

/* 承诺卡片 */
.promise-card {
  background: $primary-bg-light;
  border-radius: 24rpx;
  padding: 32rpx;
}

.promise-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $primary;
  margin-bottom: 20rpx;
  display: block;
}

.promise-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.promise-tag {
  font-size: 24rpx;
  color: $primary;
  background: white;
  padding: 8rpx 20rpx;
  border-radius: 40rpx;
}
</style>
