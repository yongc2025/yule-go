<template>
  <view class="booking-page">
    <!-- 团期信息 -->
    <view class="section schedule-info">
      <view class="section-title">出行信息</view>
      <view class="info-card">
        <view class="info-row">
          <text class="label">线路</text>
          <text class="value">{{ schedule.route_name }}</text>
        </view>
        <view class="info-row">
          <text class="label">日期</text>
          <text class="value highlight">{{ formatDateCN(schedule.trip_date) }}</text>
        </view>
        <view class="info-row">
          <text class="label">名额</text>
          <text class="value">剩余 {{ schedule.remaining_slots }} 位</text>
        </view>
        <view class="info-row">
          <text class="label">领队</text>
          <text class="value">{{ schedule.guide_name }} {{ schedule.guide_phone }}</text>
        </view>
      </view>
    </view>

    <!-- 出行人数 -->
    <view class="section">
      <view class="section-title">出行人数</view>
      <view class="people-card">
        <view class="people-row">
          <view class="people-info">
            <text class="people-label">成人</text>
            <text class="people-price">¥{{ routePrice }}/人</text>
          </view>
          <view class="stepper">
            <view class="stepper-btn" :class="{ disabled: adults <= 1 }" @tap="adults > 1 && adults--">−</view>
            <text class="stepper-val">{{ adults }}</text>
            <view class="stepper-btn" @tap="adults++">+</view>
          </view>
        </view>
        <view v-if="isFamily" class="people-row">
          <view class="people-info">
            <text class="people-label">儿童</text>
            <text class="people-price">¥{{ childPrice }}/人</text>
          </view>
          <view class="stepper">
            <view class="stepper-btn" :class="{ disabled: children <= 0 }" @tap="children > 0 && children--">−</view>
            <text class="stepper-val">{{ children }}</text>
            <view class="stepper-btn" @tap="children++">+</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 装备租赁 -->
    <view class="section">
      <view class="section-title">装备租赁（可选）</view>
      <view class="rental-card">
        <view
          v-for="item in rentalItems"
          :key="item.id"
          class="rental-row"
          @tap="toggleRental(item)"
        >
          <view class="rental-check" :class="{ checked: isRentalSelected(item.id) }">
            <text v-if="isRentalSelected(item.id)">✓</text>
          </view>
          <view class="rental-info">
            <text class="rental-name">{{ item.name }}</text>
            <text class="rental-price">¥{{ item.price_per_day }}/天</text>
          </view>
          <view v-if="isRentalSelected(item.id)" class="stepper" @tap.stop>
            <view class="stepper-btn small" :class="{ disabled: getRentalQty(item.id) <= 1 }" @tap.stop="changeRentalQty(item.id, -1)">−</view>
            <text class="stepper-val">{{ getRentalQty(item.id) }}</text>
            <view class="stepper-btn small" @tap.stop="changeRentalQty(item.id, 1)">+</view>
          </view>
        </view>
        <view v-if="!rentalItems.length" class="rental-empty">暂无可租赁装备</view>
      </view>
    </view>

    <!-- 联系信息 -->
    <view class="section">
      <view class="section-title">联系信息</view>
      <view class="form-card">
        <view class="form-row">
          <text class="form-label">姓名</text>
          <input
            v-model="contactName"
            class="form-input"
            placeholder="请输入联系人姓名"
            maxlength="20"
          />
        </view>
        <view class="form-row">
          <text class="form-label">电话</text>
          <input
            v-model="contactPhone"
            class="form-input"
            type="number"
            placeholder="请输入联系电话"
            maxlength="11"
          />
        </view>
      </view>
    </view>

    <!-- 余额抵扣 -->
    <view v-if="userBalance > 0" class="section">
      <view class="balance-row" @tap="useBalance = !useBalance">
        <view class="rental-check" :class="{ checked: useBalance }">
          <text v-if="useBalance">✓</text>
        </view>
        <text class="balance-text">使用余额抵扣（¥{{ userBalance.toFixed(2) }}）</text>
      </view>
    </view>

    <!-- 备注 -->
    <view class="section">
      <view class="section-title">备注（可选）</view>
      <textarea
        v-model="remark"
        class="remark-input"
        placeholder="有什么特殊需求可以备注"
        maxlength="200"
      />
    </view>

    <!-- 费用明细 -->
    <view class="section fee-section">
      <view class="fee-row">
        <text>团费</text>
        <text>¥{{ tripFee.toFixed(2) }}</text>
      </view>
      <view v-if="rentalFee > 0" class="fee-row">
        <text>租赁费</text>
        <text>¥{{ rentalFee.toFixed(2) }}</text>
      </view>
      <view v-if="discountAmount > 0" class="fee-row discount">
        <text>会员折扣</text>
        <text>-¥{{ discountAmount.toFixed(2) }}</text>
      </view>
      <view v-if="balanceDeduct > 0" class="fee-row discount">
        <text>余额抵扣</text>
        <text>-¥{{ balanceDeduct.toFixed(2) }}</text>
      </view>
      <view class="fee-row total">
        <text>实付金额</text>
        <text class="total-price">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <view class="submit-price">
        <text class="submit-label">合计：</text>
        <text class="submit-amount">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
      <view class="submit-btn" :class="{ disabled: submitting }" @tap="handleSubmit">
        {{ submitting ? '提交中...' : '提交订单' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { scheduleApi } from '../../api/schedule'
import { orderApi, rentalApi } from '../../api/order'
import { formatDateCN } from '../../utils/date'

// --- 路由参数 ---
const scheduleId = ref(0)
const schedule = ref({})
const route = ref({})
const routePrice = ref(0)
const childPrice = ref(0)
const isFamily = ref(false)

// --- 表单状态 ---
const adults = ref(1)
const children = ref(0)
const contactName = ref('')
const contactPhone = ref('')
const useBalance = ref(false)
const remark = ref('')
const submitting = ref(false)

// --- 租赁项 ---
const rentalItems = ref([])
const selectedRentals = reactive({}) // { rentalItemId: quantity }

// --- 用户信息（从缓存读取）---
const userBalance = ref(0)
const memberLevel = ref(0)

// --- 计算属性 ---
const tripFee = computed(() => {
  let fee = adults.value * routePrice.value
  if (isFamily.value && children.value > 0) {
    fee += children.value * childPrice.value
  }
  return fee
})

const rentalFee = computed(() => {
  let fee = 0
  for (const [id, qty] of Object.entries(selectedRentals)) {
    const item = rentalItems.value.find(r => r.id === Number(id))
    if (item) {
      fee += item.price_per_day * qty
    }
  }
  return fee
})

const subtotal = computed(() => tripFee.value + rentalFee.value)

const discountAmount = computed(() => {
  if (memberLevel.value <= 0) return 0
  const rates = { 1: 0.05, 2: 0.10, 3: 0.15 }
  return subtotal.value * (rates[memberLevel.value] || 0)
})

const balanceDeduct = computed(() => {
  if (!useBalance.value || userBalance.value <= 0) return 0
  const afterDiscount = subtotal.value - discountAmount.value
  return Math.min(userBalance.value, afterDiscount)
})

const totalAmount = computed(() => {
  const val = subtotal.value - discountAmount.value - balanceDeduct.value
  return Math.max(0, val)
})

// --- 方法 ---
function isRentalSelected(id) {
  return !!selectedRentals[id]
}

function getRentalQty(id) {
  return selectedRentals[id] || 0
}

function toggleRental(item) {
  if (selectedRentals[item.id]) {
    delete selectedRentals[item.id]
  } else {
    selectedRentals[item.id] = 1
  }
}

function changeRentalQty(id, delta) {
  const newVal = (selectedRentals[id] || 0) + delta
  if (newVal <= 0) {
    delete selectedRentals[id]
  } else {
    selectedRentals[id] = newVal
  }
}

async function loadSchedule() {
  try {
    const res = await scheduleApi.listByWeek('')
    // 直接用缓存的 schedule 数据（从团期列表页跳转时传入）
    // 如果没有缓存，需要从 API 获取
  } catch (e) {
    console.error('加载团期失败', e)
  }
}

async function loadRentals() {
  try {
    const res = await rentalApi.list()
    rentalItems.value = res.data || []
  } catch (e) {
    console.error('加载租赁项失败', e)
  }
}

function loadUserInfo() {
  try {
    const info = uni.getStorageSync('userInfo')
    if (info) {
      userBalance.value = info.balance || 0
      memberLevel.value = info.member_level || 0
    }
  } catch (e) {}
}

function validate() {
  if (!contactName.value.trim()) {
    uni.showToast({ title: '请输入联系人姓名', icon: 'none' })
    return false
  }
  if (!contactPhone.value || contactPhone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return false
  }
  if (adults.value + children.value > schedule.value.remaining_slots) {
    uni.showToast({ title: '超出剩余名额', icon: 'none' })
    return false
  }
  return true
}

async function handleSubmit() {
  if (submitting.value) return
  if (!validate()) return

  submitting.value = true
  try {
    const rentalItems = Object.entries(selectedRentals).map(([id, qty]) => ({
      rental_item_id: Number(id),
      quantity: qty
    }))

    const res = await orderApi.create({
      schedule_id: scheduleId.value,
      adults: adults.value,
      children: children.value,
      rental_items: rentalItems,
      contact_name: contactName.value.trim(),
      contact_phone: contactPhone.value,
      use_balance: useBalance.value,
      remark: remark.value
    })

    uni.showToast({ title: '下单成功', icon: 'success' })

    // 跳转到订单详情
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/order/detail?order_no=${res.data.order_no}`
      })
    }, 1500)
  } catch (e) {
    console.error('下单失败', e)
  } finally {
    submitting.value = false
  }
}

// --- 生命周期 ---
onMounted(() => {
  // 从页面参数或缓存获取团期信息
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}

  scheduleId.value = Number(options.id || 0)

  // 从缓存读取团期数据（从团期列表页传入）
  try {
    const cached = uni.getStorageSync('bookingSchedule')
    if (cached && cached.id === scheduleId.value) {
      schedule.value = cached
      routePrice.value = cached.route_price || 128
      childPrice.value = cached.child_price || 0
      isFamily.value = cached.route_type === 'family'
    }
  } catch (e) {}

  loadRentals()
  loadUserInfo()
})
</script>

<style lang="scss" scoped>
.booking-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

.section {
  margin-bottom: 20rpx;
  padding: 0 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  padding: 24rpx 0 16rpx;
}

/* 团期信息 */
.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.label {
  font-size: 28rpx;
  color: #999;
}

.value {
  font-size: 28rpx;
  color: #333;
}

.highlight {
  color: #1890ff;
  font-weight: 500;
}

/* 人数选择 */
.people-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.people-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.people-info {
  display: flex;
  flex-direction: column;
}

.people-label {
  font-size: 30rpx;
  color: #333;
}

.people-price {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stepper-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 32rpx;
  color: #333;
  font-weight: bold;

  &.small {
    width: 48rpx;
    height: 48rpx;
    font-size: 28rpx;
  }

  &.disabled {
    color: #ccc;
  }

  &:active:not(.disabled) {
    background: #e0e0e0;
  }
}

.stepper-val {
  width: 60rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
}

/* 租赁项 */
.rental-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.rental-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.rental-check {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  font-size: 24rpx;
  color: #fff;
  transition: all 0.2s;

  &.checked {
    background: #1890ff;
    border-color: #1890ff;
  }
}

.rental-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rental-name {
  font-size: 28rpx;
  color: #333;
}

.rental-price {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.rental-empty {
  padding: 32rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #999;
}

/* 联系信息 */
.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  width: 100rpx;
  font-size: 28rpx;
  color: #333;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

/* 余额 */
.balance-row {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.balance-text {
  font-size: 28rpx;
  color: #333;
}

/* 备注 */
.remark-input {
  width: 100%;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
  min-height: 120rpx;
  box-sizing: border-box;
}

/* 费用明细 */
.fee-section {
  padding-bottom: 0;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  font-size: 28rpx;
  color: #666;
  background: #fff;

  &.discount {
    color: #52c41a;
  }

  &.total {
    border-top: 1rpx solid #f0f0f0;
    padding: 24rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    border-radius: 0 0 16rpx 16rpx;
  }
}

.total-price {
  color: #ff4d4f;
  font-size: 36rpx;
}

/* 提交栏 */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.submit-price {
  flex: 1;
}

.submit-label {
  font-size: 26rpx;
  color: #666;
}

.submit-amount {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.submit-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  padding: 20rpx 60rpx;
  border-radius: 44rpx;

  &.disabled {
    opacity: 0.6;
  }

  &:active:not(.disabled) {
    opacity: 0.85;
  }
}
</style>
