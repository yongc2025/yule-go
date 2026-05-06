<template>
  <view class="invite-page">
    <!-- 邀请卡片 -->
    <view class="invite-card">
      <view class="card-header">
        <text class="title">🎣 邀请好友</text>
        <text class="subtitle">好友首单立减¥15，你得¥20奖励</text>
      </view>
      <view class="code-area">
        <text class="code-label">我的邀请码</text>
        <view class="code-row">
          <text class="code-value">{{ inviteInfo.invite_code }}</text>
          <view class="btn-copy" @tap="copyCode">复制</view>
        </view>
      </view>
      <view class="btn-share" @tap="handleShare">
        <text>分享给好友</text>
      </view>
    </view>

    <!-- 奖励统计 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-val">{{ inviteInfo.total_invited }}</text>
        <text class="stat-label">已邀请(人)</text>
      </view>
      <view class="stat-card">
        <text class="stat-val">¥{{ inviteInfo.total_reward.toFixed(0) }}</text>
        <text class="stat-label">累计奖励</text>
      </view>
    </view>

    <!-- 邀请规则 -->
    <view class="section">
      <view class="section-title">活动规则</view>
      <view class="rules-card">
        <view class="rule-item" v-for="(rule, i) in rules" :key="i">
          <text class="rule-num">{{ i + 1 }}</text>
          <text class="rule-text">{{ rule }}</text>
        </view>
      </view>
    </view>

    <!-- 邀请记录 -->
    <view class="section">
      <view class="section-title">邀请记录</view>
      <view v-if="!inviteInfo.invited_list.length" class="empty-hint">
        <text>暂无邀请记录，快去分享吧</text>
      </view>
      <view v-else class="invite-list">
        <view v-for="(item, i) in inviteInfo.invited_list" :key="i" class="invite-item">
          <view class="item-left">
            <image v-if="item.avatar" :src="item.avatar" class="avatar" />
            <view v-else class="avatar-placeholder">👤</view>
            <text class="item-name">{{ item.nickname }}</text>
          </view>
          <view class="item-right">
            <text class="item-reward" :class="{ earned: item.status === 1 }">
              {{ item.status === 1 ? '+¥' + item.reward_amount : '待奖励' }}
            </text>
            <text class="item-time">{{ item.created_at }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { referralApi } from '../../api/referral'

const inviteInfo = reactive({
  invite_code: '',
  invite_url: '',
  total_invited: 0,
  total_reward: 0,
  invited_list: []
})

const rules = [
  '分享你的邀请码给好友',
  '好友通过邀请码注册后自动绑定关系',
  '好友首单自动立减 ¥15',
  '好友首单支付成功后，你获得 ¥20 奖励到余额',
  '每个新用户只能被邀请一次'
]

async function loadInviteInfo() {
  try {
    const res = await referralApi.getMy()
    Object.assign(inviteInfo, res.data)
  } catch (e) {
    console.error('获取邀请信息失败', e)
  }
}

function copyCode() {
  uni.setClipboardData({
    data: inviteInfo.invite_code,
    success() {
      uni.showToast({ title: '已复制邀请码', icon: 'success' })
    }
  })
}

function handleShare() {
  // 小程序原生分享
  uni.showActionSheet({
    itemList: ['分享给微信好友', '生成分享图片'],
    success(res) {
      if (res.tapIndex === 0) {
        // 触发微信分享（需要页面定义 onShareAppMessage）
        uni.showToast({ title: '请点击右上角分享', icon: 'none' })
      } else {
        uni.showToast({ title: '图片分享开发中', icon: 'none' })
      }
    }
  })
}

onMounted(() => {
  loadInviteInfo()
})

// 微信分享
onShareAppMessage(() => {
  return {
    title: '渔乐出行 - 周末钓鱼露营好去处',
    path: `/pages/schedule/index?invite=${inviteInfo.invite_code}`
  }
})
</script>

<style lang="scss" scoped>
.invite-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1890ff 0%, #f5f5f5 40%);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 邀请卡片 */
.invite-card {
  margin: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: 32rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #ff4d4f;
  margin-top: 8rpx;
}

.code-area {
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.code-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.code-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #1890ff;
  letter-spacing: 8rpx;
  font-family: monospace;
}

.btn-copy {
  background: #1890ff;
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 28rpx;
  border-radius: 24rpx;

  &:active {
    opacity: 0.8;
  }
}

.btn-share {
  background: linear-gradient(135deg, #ff6b6b, #ff4d4f);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  text-align: center;
  padding: 24rpx;
  border-radius: 44rpx;

  &:active {
    opacity: 0.85;
  }
}

/* 统计 */
.stats-row {
  display: flex;
  gap: 20rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 规则 */
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

.rules-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 0;
}

.rule-num {
  width: 36rpx;
  height: 36rpx;
  background: #1890ff;
  color: #fff;
  font-size: 22rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.rule-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 邀请记录 */
.empty-hint {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}

.invite-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.invite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.item-name {
  font-size: 28rpx;
  color: #333;
}

.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.item-reward {
  font-size: 28rpx;
  color: #999;

  &.earned {
    color: #52c41a;
    font-weight: 500;
  }
}

.item-time {
  font-size: 22rpx;
  color: #ccc;
}
</style>
