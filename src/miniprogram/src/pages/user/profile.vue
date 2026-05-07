<template>
  <view class="profile-page">
    <!-- 头像区域 -->
    <view class="avatar-section">
      <view class="avatar-wrap" @tap="changeAvatar">
        <image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="avatar-edit">📷</view>
      </view>
      <text class="nickname">{{ userInfo.nickname || '用户' }}</text>
    </view>

    <!-- 信息列表 -->
    <view class="info-list">
      <view class="info-item" @tap="editNickname">
        <text class="info-label">昵称</text>
        <view class="info-right">
          <text class="info-value">{{ userInfo.nickname || '未设置' }}</text>
          <text class="info-arrow">›</text>
        </view>
      </view>

      <view class="info-item">
        <text class="info-label">手机号</text>
        <view class="info-right">
          <text class="info-value">{{ maskedPhone }}</text>
          <text class="info-arrow">›</text>
        </view>
      </view>

      <view class="info-item">
        <text class="info-label">会员等级</text>
        <view class="info-right">
          <text class="info-value">{{ levelText }}</text>
        </view>
      </view>

      <view class="info-item">
        <text class="info-label">账户余额</text>
        <view class="info-right">
          <text class="info-value balance">¥{{ userInfo.balance?.toFixed(2) || '0.00' }}</text>
        </view>
      </view>

      <view class="info-item">
        <text class="info-label">邀请码</text>
        <view class="info-right">
          <text class="info-value code">{{ userInfo.invite_code || '-' }}</text>
          <text class="copy-btn" @tap="copyCode">复制</text>
        </view>
      </view>

      <view class="info-item">
        <text class="info-label">注册时间</text>
        <view class="info-right">
          <text class="info-value">{{ userInfo.created_at || '-' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../../api/index'

const userInfo = ref({})

const levelMap = { 0: '普通用户', 1: '银卡会员', 2: '金卡会员', 3: '钻石会员' }
const levelText = computed(() => levelMap[userInfo.value.member_level] || '普通用户')

const maskedPhone = computed(() => {
  const phone = userInfo.value.phone
  if (!phone) return '未绑定'
  if (phone.length === 11) return phone.slice(0, 3) + '****' + phone.slice(7)
  return phone
})

async function loadProfile() {
  try {
    const res = await request({ url: '/user/profile' })
    userInfo.value = res.data
  } catch (e) {
    console.error('获取用户信息失败', e)
  }
}

function editNickname() {
  uni.showModal({
    title: '修改昵称',
    editable: true,
    placeholderText: '请输入新昵称',
    success(res) {
      if (res.confirm && res.content) {
        updateProfile({ nickname: res.content.trim() })
      }
    }
  })
}

function changeAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success(res) {
      // TODO: 上传头像到 OSS/CDN，当前直接使用本地路径
      const avatarPath = res.tempFilePaths[0]
      updateProfile({ avatar: avatarPath })
    }
  })
}

async function updateProfile(data) {
  try {
    const res = await request({
      url: '/user/profile',
      method: 'PUT',
      data
    })
    userInfo.value = res.data
    uni.showToast({ title: '更新成功', icon: 'success' })
  } catch (e) {
    console.error('更新失败', e)
  }
}

function copyCode() {
  if (userInfo.value.invite_code) {
    uni.setClipboardData({
      data: userInfo.value.invite_code,
      success() {
        uni.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 头像区域 */
.avatar-section {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  padding: 60rpx 0 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  margin-bottom: 20rpx;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.6);
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 48rpx;
  height: 48rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.nickname {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

/* 信息列表 */
.info-list {
  margin: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #fafafa;
  }
}

.info-label {
  font-size: 28rpx;
  color: #666;
  flex-shrink: 0;
}

.info-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;

  &.balance {
    color: #ff4d4f;
    font-weight: 600;
  }

  &.code {
    font-family: monospace;
    letter-spacing: 2rpx;
  }
}

.info-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.copy-btn {
  font-size: 24rpx;
  color: #1890ff;
  padding: 4rpx 16rpx;
  border: 1rpx solid #1890ff;
  border-radius: 20rpx;
  margin-left: 12rpx;

  &:active {
    background: #e6f7ff;
  }
}
</style>
