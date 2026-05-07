const api = require('../../utils/api')

Page({
  data: {
    info: {},       // 活动信息（从上一页传入）
    adults: 1,
    children: 0,
    contactName: '',
    contactPhone: '',
    remark: '',
    adultFee: 0,
    childFee: 0,
    totalFee: 0,
    submitting: false
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

  // 计算费用
  calcFee() {
    const { info, adults, children } = this.data
    const adultFee = (info.price || 0) * adults
    const childFee = (info.childPrice || 0) * children
    this.setData({
      adultFee,
      childFee,
      totalFee: adultFee + childFee
    })
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

  // 提交订单
  submitOrder() {
    // 校验
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

    const { info, adults, children, contactName, contactPhone, remark, totalFee } = this.data

    // 调用云函数创建订单
    api.call('orders', {
      action: 'create',
      activityId: info.activityId,
      scheduleId: info.scheduleId,
      adults,
      children,
      contactName,
      contactPhone,
      remark,
      totalFee
    }).then(orderInfo => {
      // 发起微信支付
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
          if (err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            wx.showToast({ title: '支付失败', icon: 'none' })
          }
          reject(err)
        }
      })
    })
  }
})
