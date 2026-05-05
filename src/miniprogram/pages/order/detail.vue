<template>
  <view class="order-detail-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-wrap">
      <view class="loading-spinner"></view>
    </view>

    <template v-else-if="order">
      <!-- 状态头部 -->
      <view class="status-header" :class="'bg-' + order.status">
        <text class="status-text">{{ order.status_text }}</text>
        <text class="status-desc">{{ statusDesc }}</text>
      </view>

      <!-- 出行信息 -->
      <view class="section">
        <view class="section-card">
          <view class="info-row">
            <text class="label">线路</text>
            <text class="value">{{ order.route_name }}</text>
          </view>
          <view class="info-row">
            <text class="label">日期</text>
            <text class="value highlight">{{ formatDateCN(order.trip_date) }}</text>
          </view>
          <view class="info-row">
            <text class="label">人数</text>
            <text class="value">{{ order.adults }}成人{{ order.children > 0 ? ' + ' + order.children + '儿童' : '' }}</text>
          </view>
          <view class="info-row">
            <text class="label">联系人</text>
            <text class="value">{{ order.contact_name }} {{ order.contact_phone }}</text>
          </view>
          <view v-if="order.remark" class="info-row">
            <text class="label">备注</text>
            <text class="value">{{ order.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 租赁明细 -->
      <view v-if="order.rental_items && order.rental_items.length" class="section">
        <view class="section-title">租赁装备</view>
        <view class="section-card">
          <view v-for="item in order.rental_items" :key="item.rental_item_id" class="rental-row">
            <text class="rental-name">{{ item.name || '装备' }} × {{ item.quantity }}</text>
            <text class="rental-price">¥{{ item.subtotal.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="section">
        <view class="section-title">费用明细</view>
        <view class="section-card">
          <view class="fee-row">
            <text>团费</text>
            <text>¥{{ order.trip_fee.toFixed(2) }}</text>
          </view>
          <view v-if="order.rental_fee > 0" class="fee-row">
            <text>租赁费</text>
            <text>¥{{ order.rental_fee.toFixed(2) }}</text>
          </view>
          <view v-if="order.discount_amount > 0" class="fee-row discount">
            <text>会员折扣</text>
            <text>-¥{{ order.discount_amount.toFixed(2) }}</text>
          </view>
          <view v-if="order.balance_used > 0" class="fee-row discount">
            <text>余额抵扣</text>
            <text>-¥{{ order.balance_used.toFixed(2) }}</text>
          </view>
          <view class="fee-row total">
            <text>实付金额</text>
            <text class="total-price">¥{{ order.total_amount.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="section">
        <view class="section-title">订单信息</view>
        <view class="section-card">
          <view class="info-row">
            <text class="label">订单号</text>
            <text class="value mono" @tap="copyOrderNo">{{ order.order_no }}</text>
          </view>
          <view class="info-row">
            <text class="label">下单时间</text>
            <text class="value">{{ formatTime(order.created_at) }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view v-if="order.status === 0" class="action-bar">
        <view class="btn-cancel" @tap="handleCancel">取消订单</view>
        <view class="btn-pay" @tap="handlePay">立即支付</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { orderApi } from '../../api/order'
import { formatDateCN } from '../../utils/date'

const order = ref(null)
const loading = ref(true)

const statusDesc = computed(() => {
  const map = {
    0: '请在15分钟内完成支付',
    1: '已确认，按时出行即可',
    2: '正在旅途中，玩得开心！',
    3: '感谢您的参与，欢迎再来！',
    4: '订单已取消',
    5: '已退款，金额将原路返回'
  }
  return map[order.value?.status] || ''
})

async function loadOrder(orderNo) {
  loading.value = true
  try {
    const res = await orderApi.detail(orderNo)
    order.value = res.data
  } catch (e) {
    uni.showToast({ title: '获取订单失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function copyOrderNo() {
  uni.setClipboardData({
    data: order.value.order_no,
    success() {
      uni.showToast({ title: '已复制', icon: 'success' })
    }
  })
}

function handleCancel() {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个订单吗？',
    success(res) {
      if (res.confirm) {
        orderApi.cancel(order.value.order_no, '用户主动取消').then(() => {
          uni.showToast({ title: '已取消', icon: 'success' })
          loadOrder(order.value.order_no)
        }).catch(() => {})
      }
    }
  })
}

function handlePay() {
  // TODO: 调用微信支付
  uni.showToast({ title: '微信支付待接入', icon: 'none' })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  const orderNo = options.order_no
  if (orderNo) {
    loadOrder(orderNo)
  }
})
</script>

<style lang="scss" scoped>
.order-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e6f7ff;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 状态头部 */
.status-header {
  padding: 48rpx 32rpx;
  color: #fff;
}

.bg-0 { background: linear-gradient(135deg, #faad14, #ffc53d); }
.bg-1 { background: linear-gradient(135deg, #1890ff, #40a9ff); }
.bg-2 { background: linear-gradient(135deg, #722ed1, #b37feb); }
.bg-3 { background: linear-gradient(135deg, #52c41a, #73d13d); }
.bg-4, .bg-5 { background: linear-gradient(135deg, #999, #bbb); }

.status-text {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.status-desc {
  display: block;
  font-size: 26rpx;
  opacity: 0.9;
}

/* 内容区 */
.section {
  padding: 0 24rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  padding: 24rpx 0 12rpx;
}

.section-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.label {
  font-size: 28rpx;
  color: #999;
  flex-shrink: 0;
}

.value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 24rpx;
}

.highlight {
  color: #1890ff;
  font-weight: 500;
}

.mono {
  font-family: monospace;
  font-size: 24rpx;
}

/* 租赁项 */
.rental-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  font-size: 28rpx;
}

.rental-name {
  color: #333;
}

.rental-price {
  color: #666;
}

/* 费用 */
.fee-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;

  &.discount {
    color: #52c41a;
  }

  &.total {
    border-top: 1rpx solid #f0f0f0;
    padding: 24rpx 0;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
  }
}

.total-price {
  color: #ff4d4f;
  font-size: 36rpx;
}

/* 操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.btn-cancel {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  border: 2rpx solid #ddd;
  border-radius: 44rpx;
  font-size: 28rpx;
  color: #666;
}

.btn-pay {
  flex: 2;
  text-align: center;
  padding: 22rpx 0;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border-radius: 44rpx;
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}
</style>
