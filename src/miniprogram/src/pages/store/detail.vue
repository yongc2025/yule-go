<template>
  <view class="page">
    <!-- 头图轮播区 -->
    <view class="header-image">
      <view class="status-bar">
        <text class="time">9:41</text>
        <text class="icons">📶 🔋</text>
      </view>
      <view class="back-btn" @tap="goBack">←</view>
      <view class="share-btn">↗</view>
      <view class="video-hint">▶️ 听老王策（15秒）</view>
      <view class="indicators">
        <view class="dot active"></view>
        <view class="dot"></view>
        <view class="dot"></view>
        <view class="dot"></view>
      </view>
    </view>

    <!-- 门店信息 -->
    <view class="store-info-section">
      <view class="store-info-row">
        <view class="store-avatar">👨‍🌾</view>
        <view class="store-info">
          <view class="store-name-row">
            <text class="store-name">{{ merchant.name }}</text>
            <text class="badge badge-primary">营业中</text>
          </view>
          <text class="store-meta">
            老板：{{ merchant.ownerName }} · ★★★★★ {{ merchant.rating }}分({{ merchant.ratingCount }}条)
          </text>
        </view>
      </view>

      <!-- 信任数据条 -->
      <view class="trust-bar">
        <view class="trust-item">
          <text class="trust-value">{{ merchant.serviceCount }}</text>
          <text class="trust-label">已服务</text>
        </view>
        <view class="trust-item">
          <text class="trust-value">{{ merchant.rating }}</text>
          <text class="trust-label">评分</text>
        </view>
        <view class="trust-item">
          <text class="trust-value">96%</text>
          <text class="trust-label">好评率</text>
        </view>
        <view class="trust-item">
          <text class="trust-value">3年</text>
          <text class="trust-label">开店时长</text>
        </view>
      </view>
    </view>

    <!-- 门店介绍 -->
    <view class="section">
      <view class="info-card">
        <text class="info-line">📍 {{ merchant.address }}（距您{{ merchant.distance }}km）</text>
        <text class="info-line">📞 {{ merchant.phone }}（{{ merchant.ownerName }}）</text>
        <text class="info-line">🕐 营业时间：{{ merchant.businessHours }}</text>
        <view class="info-btns">
          <view class="btn btn-outline btn-sm" style="flex:1" @tap="openMap">🧭 导航</view>
          <view class="btn btn-primary btn-sm" style="flex:1" @tap="callPhone">📞 拨打</view>
        </view>
      </view>
    </view>

    <!-- 本周活动 -->
    <view class="section">
      <text class="section-title">🎯 本周活动</text>
      <view
        class="activity-row"
        v-for="activity in activities"
        :key="activity.id"
        @tap="goActivityDetail(activity.id)"
      >
        <view class="activity-icon" :style="{ background: activity.gradient }">
          {{ activity.emoji }}
        </view>
        <view class="activity-info">
          <text class="activity-name">{{ activity.name }}</text>
          <text class="activity-time">{{ activity.date }} {{ activity.dayOfWeek }} {{ activity.time }}</text>
          <view class="activity-tags">
            <text class="badge-accent" v-if="activity.remainingSlots <= 3">仅剩{{ activity.remainingSlots }}位</text>
            <text class="badge-primary" v-else>剩余{{ activity.remainingSlots }}位</text>
            <text class="mini-tag" v-if="activity.tags[0]">{{ activity.tags[0].split(' ')[1] }}</text>
          </view>
        </view>
        <view class="activity-price">
          <text class="price">¥{{ activity.price }}</text>
          <text class="price-unit">{{ activity.priceUnit }}</text>
        </view>
      </view>
    </view>

    <!-- 用户评价 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">💬 用户评价</text>
        <text class="section-link">查看全部 →</text>
      </view>
      <view class="review-card" v-for="review in reviews" :key="review.id">
        <view class="review-header">
          <view class="review-avatar" :style="{ background: review.bgColor }">{{ review.userEmoji }}</view>
          <view>
            <text class="review-name">{{ review.userName }}</text>
            <text class="review-meta">{{ review.date }} · {{ review.activityName }}</text>
          </view>
          <text class="review-stars">★★★★★</text>
        </view>
        <text class="review-content">{{ review.content }}</text>
      </view>
    </view>

    <!-- 装备租赁 -->
    <view class="section">
      <text class="section-title">🎒 可租装备</text>
      <scroll-view scroll-x class="rental-scroll">
        <view class="rental-item" v-for="item in rentalItems" :key="item.id">
          <text class="rental-emoji">{{ item.emoji }}</text>
          <text class="rental-name">{{ item.name }}</text>
          <text class="rental-price">¥{{ item.price }}/{{ item.unit }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="bottom-action" @tap="toggleFavorite">
        <text class="bottom-icon">{{ isFavorite ? '⭐' : '☆' }}</text>
        <text class="bottom-label">收藏</text>
      </view>
      <view class="bottom-action" @tap="switchStore">
        <text class="bottom-icon">🔄</text>
        <text class="bottom-label">切换门店</text>
      </view>
      <view class="btn btn-primary bottom-main-btn" @tap="viewAllActivities">查看全部活动</view>
      <view class="btn btn-accent bottom-main-btn" @tap="setPrimary">设为我的主场店</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { mockMerchant, mockActivities, mockReviews, mockRentalItems } from '@/mock/data.js'

const merchant = ref(mockMerchant)
const activities = ref(mockActivities)
const reviews = ref(mockReviews)
const rentalItems = ref(mockRentalItems)
const isFavorite = ref(false)

const goBack = () => uni.navigateBack()
const callPhone = () => uni.makePhoneCall({ phoneNumber: merchant.value.phone })
const openMap = () => uni.openLocation({
  latitude: merchant.value.latitude,
  longitude: merchant.value.longitude,
  name: merchant.value.name,
  address: merchant.value.address
})
const goActivityDetail = (id) => uni.navigateTo({ url: `/pages/activity/detail?id=${id}` })
const toggleFavorite = () => { isFavorite.value = !isFavorite.value }
const switchStore = () => uni.navigateTo({ url: '/pages/discovery/index' })
const viewAllActivities = () => {}
const setPrimary = () => { uni.showToast({ title: '已设为主场店', icon: 'success' }) }
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.page {
  background: $bg-page;
  min-height: 100vh;
  padding-bottom: 160rpx;
}

/* 头图 */
.header-image {
  height: 560rpx;
  background: linear-gradient(180deg, #264653 0%, #2A9D8F 60%, #E9C46A 100%);
  position: relative;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: white;
}

.back-btn, .share-btn {
  position: absolute;
  top: 100rpx;
  width: 72rpx;
  height: 72rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36rpx;
}

.back-btn { left: 32rpx; }
.share-btn { right: 32rpx; font-size: 32rpx; }

.video-hint {
  position: absolute;
  bottom: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  color: white;
  font-size: 24rpx;
}

.indicators {
  position: absolute;
  bottom: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12rpx;
}

.dot {
  width: 16rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4rpx;

  &.active {
    width: 40rpx;
    background: white;
  }
}

/* 门店信息 */
.store-info-section {
  padding: 32rpx 32rpx 0;
}

.store-info-row {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.store-avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #F4A261, #E76F51);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  border: 6rpx solid white;
  box-shadow: $shadow-md;
  margin-top: -80rpx;
  position: relative;
  z-index: 10;
}

.store-info {
  flex: 1;
  padding-top: 4rpx;
}

.store-name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.store-name {
  font-size: 44rpx;
  font-weight: 800;
}

.badge {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
  font-weight: 500;
}

.badge-primary {
  background: $primary-bg;
  color: $primary;
}

.store-meta {
  font-size: 26rpx;
  color: $text-secondary;
  margin-top: 8rpx;
  display: block;
}

/* 信任数据条 */
.trust-bar {
  display: flex;
  margin-top: 32rpx;
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
}

.trust-item {
  flex: 1;
  text-align: center;
  border-right: 2rpx solid #F0F0F0;

  &:last-child { border-right: none; }
}

.trust-value {
  font-size: 44rpx;
  font-weight: 800;
  color: $primary;
  display: block;
}

.trust-label {
  font-size: 22rpx;
  color: $text-tertiary;
  margin-top: 4rpx;
  display: block;
}

/* Section */
.section {
  padding: 32rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-link {
  font-size: 26rpx;
  color: $primary;
}

/* 门店介绍卡片 */
.info-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: $shadow-sm;
}

.info-line {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 2;
  display: block;
}

.info-btns {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
}

/* 活动行 */
.activity-row {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.activity-icon {
  width: 144rpx;
  height: 144rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
}

.activity-name {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
}

.activity-time {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.activity-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 12rpx;
}

.badge-accent {
  font-size: 20rpx;
  background: $accent-bg;
  color: $accent;
  padding: 4rpx 12rpx;
  border-radius: $radius-full;
}

.badge-primary {
  font-size: 20rpx;
  background: $primary-bg;
  color: $primary;
  padding: 4rpx 12rpx;
  border-radius: $radius-full;
}

.mini-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: $bg-page;
  color: $text-secondary;
  border-radius: $radius-full;
}

.activity-price {
  text-align: right;
}

.price {
  font-size: 40rpx;
  font-weight: 800;
  color: $accent;
  display: block;
}

.price-unit {
  font-size: 22rpx;
  color: $text-tertiary;
}

/* 评价 */
.review-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
  margin-bottom: 20rpx;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.review-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.review-name {
  font-size: 28rpx;
  font-weight: 600;
  display: block;
}

.review-meta {
  font-size: 22rpx;
  color: $text-tertiary;
  display: block;
}

.review-stars {
  margin-left: auto;
  color: #F59E0B;
  font-size: 24rpx;
}

.review-content {
  font-size: 28rpx;
  color: $text-secondary;
  line-height: 1.6;
}

/* 装备 */
.rental-scroll {
  white-space: nowrap;
}

.rental-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 240rpx;
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
  margin-right: 20rpx;
}

.rental-emoji {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.rental-name {
  font-size: 26rpx;
  font-weight: 600;
}

.rental-price {
  font-size: 30rpx;
  font-weight: 800;
  color: $accent;
  margin-top: 8rpx;
}

/* 底部栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  padding: 24rpx 32rpx 68rpx;
  border-top: 2rpx solid #E5E5E5;
  display: flex;
  align-items: center;
  gap: 24rpx;
  z-index: 100;
}

.bottom-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.bottom-icon {
  font-size: 40rpx;
}

.bottom-label {
  font-size: 20rpx;
  color: $text-tertiary;
}

.bottom-main-btn {
  flex: 1;
  padding: 24rpx 0;
  font-size: 28rpx;
}

.btn-primary {
  background: $primary;
  color: $text-white;
}

.btn-accent {
  background: $accent;
  color: $text-white;
}

.btn-outline {
  background: transparent;
  border: 3rpx solid $primary;
  color: $primary;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  font-weight: 600;
}

.btn-sm {
  padding: 16rpx 32rpx;
  font-size: 26rpx;
}
</style>
