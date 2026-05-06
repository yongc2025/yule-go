<template>
  <view class="member-page">
    <!-- 会员卡片 -->
    <view class="member-card" :class="'level-' + memberInfo.member_level">
      <view class="card-top">
        <view class="level-badge">{{ memberInfo.level_text }}</view>
        <text class="discount-tag" v-if="memberInfo.discount < 1">
          全场{{ (memberInfo.discount * 10).toFixed(0) }}折
        </text>
      </view>
      <view class="balance-area">
        <text class="balance-label">账户余额</text>
        <text class="balance-amount">¥{{ memberInfo.balance.toFixed(2) }}</text>
      </view>
      <view class="card-bottom">
        <view class="stat-item">
          <text class="stat-val">¥{{ memberInfo.total_recharge.toFixed(0) }}</text>
          <text class="stat-label">累计充值</text>
        </view>
        <view class="stat-item">
          <text class="stat-val">{{ memberInfo.invite_code }}</text>
          <text class="stat-label">邀请码</text>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="action-item" @tap="goRecharge">
        <text class="action-icon">💰</text>
        <text class="action-text">充值</text>
      </view>
      <view class="action-item" @tap="goRechargeRecords">
        <text class="action-icon">📋</text>
        <text class="action-text">充值记录</text>
      </view>
      <view class="action-item" @tap="goOrders">
        <text class="action-icon">📦</text>
        <text class="action-text">我的订单</text>
      </view>
      <view class="action-item" @tap="goInvite">
        <text class="action-icon">🎁</text>
        <text class="action-text">邀请好友</text>
      </view>
    </view>

    <!-- 会员权益 -->
    <view class="section">
      <view class="section-title">会员权益</view>
      <view class="benefits-card">
        <view class="benefit-row" v-for="(benefit, i) in benefits" :key="i">
          <text class="benefit-icon">{{ benefit.icon }}</text>
          <view class="benefit-info">
            <text class="benefit-name">{{ benefit.name }}</text>
            <text class="benefit-desc">{{ benefit.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 充值方案 -->
    <view class="section">
      <view class="section-title">充值升级</view>
      <view class="plan-cards">
        <view
          v-for="plan in plans"
          :key="plan.amount"
          class="plan-card"
          :class="{ recommended: plan.amount === 1000 }"
          @tap="handleRecharge(plan)"
        >
          <view v-if="plan.amount === 1000" class="plan-badge">推荐</view>
          <text class="plan-amount">¥{{ plan.amount }}</text>
          <text class="plan-level">{{ plan.level_text }}</text>
          <text class="plan-perks">{{ plan.perks }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { memberApi } from '../../api/member'

const memberInfo = reactive({
  member_level: 0,
  level_text: '普通用户',
  balance: 0,
  total_recharge: 0,
  discount: 1.0,
  invite_code: ''
})

const plans = ref([])

const benefits = [
  { icon: '🏷️', name: '专属折扣', desc: '渔具 8.5~9.5 折' },
  { icon: '💵', name: '旅行立减', desc: '每次出行立减 10~30 元' },
  { icon: '🎣', name: '装备福利', desc: '免费租赁装备' },
  { icon: '⭐', name: '优先留位', desc: '旺季优先预留名额' }
]

async function loadMemberInfo() {
  try {
    const res = await memberApi.getInfo()
    Object.assign(memberInfo, res.data)
    // 缓存用户信息
    uni.setStorageSync('userInfo', res.data)
  } catch (e) {
    console.error('获取会员信息失败', e)
  }
}

async function loadPlans() {
  try {
    const res = await memberApi.getPlans()
    plans.value = res.data || []
  } catch (e) {
    console.error('获取充值方案失败', e)
  }
}

function goRecharge() {
  // 滚动到充值方案区域
  uni.pageScrollTo({ selector: '.plan-cards', duration: 300 })
}

function goRechargeRecords() {
  uni.navigateTo({ url: '/pages/member/recharge-records' })
}

function goOrders() {
  uni.switchTab({ url: '/pages/order/list' })
}

function goInvite() {
  uni.navigateTo({ url: '/pages/invite/index' })
}

function handleRecharge(plan) {
  uni.showModal({
    title: `充值 ¥${plan.amount}`,
    content: `升级为${plan.level_text}，${plan.perks}`,
    confirmText: '确认充值',
    success(res) {
      if (res.confirm) {
        doRecharge(plan.amount)
      }
    }
  })
}

async function doRecharge(amount) {
  try {
    const res = await memberApi.recharge(amount)
    uni.showToast({ title: '充值成功', icon: 'success' })
    // TODO: 接入微信支付后，此处调用 wx.requestPayment
    setTimeout(() => {
      loadMemberInfo()
    }, 1000)
  } catch (e) {
    console.error('充值失败', e)
  }
}

onMounted(() => {
  loadMemberInfo()
  loadPlans()
})
</script>

<style lang="scss" scoped>
.member-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 会员卡片 */
.member-card {
  margin: 24rpx;
  border-radius: 24rpx;
  padding: 32rpx;
  color: #fff;
  position: relative;
  overflow: hidden;

  &.level-0 {
    background: linear-gradient(135deg, #666, #888);
  }
  &.level-1 {
    background: linear-gradient(135deg, #b8860b, #daa520);
  }
  &.level-2 {
    background: linear-gradient(135deg, #c0392b, #e74c3c);
  }
  &.level-3 {
    background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  }
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.level-badge {
  background: rgba(255, 255, 255, 0.25);
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.discount-tag {
  background: rgba(255, 255, 255, 0.15);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.balance-area {
  margin-bottom: 28rpx;
}

.balance-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 8rpx;
}

.balance-amount {
  font-size: 56rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.card-bottom {
  display: flex;
  gap: 48rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-size: 28rpx;
  font-weight: 500;
}

.stat-label {
  font-size: 22rpx;
  opacity: 0.7;
  margin-top: 4rpx;
}

/* 快捷入口 */
.quick-actions {
  display: flex;
  margin: 0 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 0;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;

  &:active {
    opacity: 0.7;
  }
}

.action-icon {
  font-size: 44rpx;
}

.action-text {
  font-size: 24rpx;
  color: #333;
}

/* 权益 */
.section {
  padding: 0 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.benefits-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 8rpx 24rpx;
}

.benefit-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.benefit-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.benefit-info {
  flex: 1;
}

.benefit-name {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.benefit-desc {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 充值方案 */
.plan-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.plan-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  border: 2rpx solid #f0f0f0;
  position: relative;
  overflow: hidden;

  &.recommended {
    border-color: #1890ff;
    background: linear-gradient(135deg, #e6f7ff, #fff);
  }

  &:active {
    background: #fafafa;
  }
}

.plan-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #1890ff;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 20rpx 6rpx;
  border-radius: 0 0 0 20rpx;
}

.plan-amount {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #ff4d4f;
  margin-bottom: 8rpx;
}

.plan-level {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.plan-perks {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}
</style>
