// pages/booking/booking.js
// 预约下单页（含优惠券/余额/邀请立减/同行优惠）

const api = require('../../utils/api')

Page({
  data: {
    info: {},       // 活动信息（从上一页传入）
    adults: 1,
    children: 0,
    contactName: '',
    contactPhone: '',
    remark: '',

    // 费用
    originalFee: 0,
    adultFee: 0,
    childFee: 0,
    finalFee: 0,

    // 优惠明细
    companionDiscount: 0,
    companionRule: '',
    companionGift: '',
    memberDiscount: 0,
    inviteDiscount: 0,
    isFirstOrder: false,
    couponDiscount: 0,
    selectedCoupon: null,
    availableCoupons: [],
    userBalance: 0,
    balanceDeduction: 0,
    useBalance: false,
    bestDiscount: 0,
    discountType: '',

    // UI 状态
    submitting: false,
    subscribed: false,
    showCouponPicker: false
  },

  onLoad(options) {
    if (options.data) {
      const info = JSON.parse(decodeURIComponent(options.data))
      this.setData({ info })
      this.calcFee()
    }
  },

  // 调整成人数
  adjustAdults(e) {
    const delta = e.currentTarget.dataset.delta
    const adults = Math.max(1, Math.min(20, this.data.adults + delta))
    this.setData({ adults })
    this.calcFee()
  },

  // 调整儿童数
  adjustChildren(e) {
    const delta = e.currentTarget.dataset.delta
    const children = Math.max(0, Math.min(10, this.data.children + delta))
    this.setData({ children })
    this.calcFee()
  },

  // 计算费用（本地快速预览 + 异步精确计算）
  calcFee() {
    const { info, adults, children } = this.data
    const adultFee = (info.price || 0) * adults
    const childFee = (info.childPrice || 0) * children
    const originalFee = adultFee + childFee

    // 本地快速预览同行优惠
    const totalPeople = adults + children
    let companionDiscount = 0
    let companionRule = ''
    let companionGift = ''
    if (totalPeople >= 3) {
      companionDiscount = 15 * totalPeople
      companionRule = `${totalPeople}人同行，每人立减¥15`
      companionGift = '鱼饵礼包'
    } else if (totalPeople >= 2) {
      companionDiscount = 10 * totalPeople
      companionRule = `${totalPeople}人同行，每人立减¥10`
    }

    this.setData({
      adultFee,
      childFee,
      originalFee,
      companionDiscount,
      companionRule,
      companionGift,
      finalFee: Math.max(0, originalFee - companionDiscount)
    })

    // 异步精确计算（含会员/券/余额/邀请）
    this._fetchDiscountPreview()
  },

  // 异步获取优惠预览
  _fetchDiscountPreview() {
    const { info, adults, children, selectedCoupon, useBalance } = this.data
    if (!info.activityId) return

    api.call('orders', {
      action: 'calcDiscount',
      activityId: info.activityId,
      adults,
      children,
      couponId: selectedCoupon ? selectedCoupon._id : '',
      useBalance
    }, { showLoading: false }).then(res => {
      if (res.code === 0) {
        const d = res.data
        this.setData({
          originalFee: d.originalFee,
          companionDiscount: d.companionDiscount,
          companionRule: d.companionRule,
          companionGift: d.companionGift,
          memberDiscount: d.memberDiscount,
          inviteDiscount: d.inviteDiscount,
          isFirstOrder: d.isFirstOrder,
          couponDiscount: d.couponDiscount,
          availableCoupons: d.availableCoupons || [],
          userBalance: d.userBalance,
          balanceDeduction: d.balanceDeduction,
          bestDiscount: d.bestDiscount,
          discountType: d.discountType,
          finalFee: d.finalFee
        })
      }
    }).catch(() => {})
  },

  // 切换余额抵扣
  toggleBalance() {
    this.setData({ useBalance: !this.data.useBalance })
    this._fetchDiscountPreview()
  },

  // 打开优惠券选择器
  openCouponPicker() {
    this.setData({ showCouponPicker: true })
  },

  // 关闭优惠券选择器
  closeCouponPicker() {
    this.setData({ showCouponPicker: false })
  },

  // 选择优惠券
  selectCoupon(e) {
    const coupon = e.currentTarget.dataset.coupon
    const current = this.data.selectedCoupon
    // 点击已选中的券则取消选择
    if (current && current._id === coupon._id) {
      this.setData({ selectedCoupon: null, showCouponPicker: false })
    } else {
      this.setData({ selectedCoupon: coupon, showCouponPicker: false })
    }
    this._fetchDiscountPreview()
  },

  // 不使用优惠券
  clearCoupon() {
    this.setData({ selectedCoupon: null, showCouponPicker: false })
    this._fetchDiscountPreview()
  },

  // 输入联系人
  onInputName(e) {
    this.setData({ contactName: e.detail.value })
  },

  onInputPhone(e) {
    this.setData({ contactPhone: e.detail.value })
  },

  onInputRemark(e) {
    this.setData({ remark: e.detail.value })
  },

  // 请求订阅消息授权
  requestSubscribe() {
    const templateIds = []
    if (templateIds.length === 0) {
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      wx.requestSubscribeMessage({
        tmplIds: templateIds,
        success: (res) => {
          const accepted = Object.values(res).some(v => v === 'accept')
          if (accepted) {
            this.setData({ subscribed: true })
            for (const [tid, status] of Object.entries(res)) {
              if (status === 'accept') {
                api.callSilent('notify', {
                  action: 'saveSubscription',
                  templateId: tid,
                  status: 'authorized'
                })
              }
            }
          }
          resolve()
        },
        fail: () => resolve()
      })
    })
  },

  // 提交订单
  submitOrder() {
    if (!this.data.contactName.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(this.data.contactPhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (this.data.submitting) return

    this.setData({ submitting: true })

    this.requestSubscribe().then(() => {
      return this._doCreateOrder()
    }).catch(err => {
      console.error('下单流程异常:', err)
      this.setData({ submitting: false })
      wx.showToast({ title: '下单失败，请重试', icon: 'none' })
    })
  },

  _doCreateOrder() {
    const { info, adults, children, contactName, contactPhone, remark, finalFee, selectedCoupon, useBalance } = this.data

    api.call('orders', {
      action: 'create',
      activityId: info.activityId,
      scheduleId: info.scheduleId,
      adults,
      children,
      contactName,
      contactPhone,
      remark,
      totalFee: finalFee,
      couponId: selectedCoupon ? selectedCoupon._id : '',
      useBalance
    }).then(orderInfo => {
      if (orderInfo.mockPay) {
        console.log('[MOCK_PAY] 模拟支付成功，订单号:', orderInfo.orderNo)
        return Promise.resolve()
      }
      return this.wxPay(orderInfo)
    }).then(() => {
      wx.showToast({ title: '支付成功！', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/orders/orders' })
      }, 1500)
    }).catch(err => {
      console.error('下单失败:', err)
      this.setData({ submitting: false })
    })
  },

  // 微信支付
  wxPay(orderInfo) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        ...orderInfo.payment,
        success: resolve,
        fail: (err) => {
          api.callSilent('orders', {
            action: 'cancel',
            orderId: orderInfo.orderId
          })
          if (err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            wx.showToast({ title: '支付失败，请重试', icon: 'none' })
          }
          reject(err)
        }
      })
    })
  }
})
