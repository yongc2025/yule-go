// pages/member/recharge.js
// 充值中心 — 三档充值方案

const api = require('../../utils/api')

Page({
  data: {
    merchantId: '',
    wallet: {
      balance: 0,
      memberLevel: 0,
      memberName: '普通用户',
      totalRecharge: 0,
      travelDiscount: 0
    },
    tiers: [],
    selectedTier: '',
    submitting: false
  },

  onLoad(options) {
    if (options.merchantId) {
      this.setData({ merchantId: options.merchantId })
    }
    this.loadTiers()
  },

  onShow() {
    this.loadWallet()
  },

  // 加载充值档位
  loadTiers() {
    api.call('wallet', { action: 'getTiers' }, { showLoading: false }).then(data => {
      // 标记主推档位
      const tiers = data.map(t => ({
        ...t,
        recommended: t.id === 'gold'
      }))
      this.setData({ tiers })
    })
  },

  // 加载钱包信息
  loadWallet() {
    const merchantId = this.data.merchantId
    if (!merchantId) {
      // 没有 merchantId 时，加载第一个门店
      const db = wx.cloud.database()
      db.collection('merchants').limit(1).get().then(res => {
        if (res.data.length > 0) {
          this.setData({ merchantId: res.data[0]._id })
          this._fetchWallet(res.data[0]._id)
        }
      })
      return
    }
    this._fetchWallet(merchantId)
  },

  _fetchWallet(merchantId) {
    api.call('wallet', {
      action: 'getWallet',
      merchantId
    }, { showLoading: false }).then(data => {
      this.setData({ wallet: data })
    })
  },

  // 选择档位
  selectTier(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ selectedTier: id })
  },

  // 跳转充值记录
  goRecords() {
    wx.navigateTo({ url: `/pages/member/records?merchantId=${this.data.merchantId}` })
  },

  // 执行充值
  doRecharge() {
    if (!this.data.selectedTier) {
      wx.showToast({ title: '请选择充值方案', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    if (!this.data.merchantId) {
      wx.showToast({ title: '请先选择门店', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    api.call('wallet', {
      action: 'recharge',
      merchantId: this.data.merchantId,
      tierId: this.data.selectedTier
    }).then(data => {
      this.setData({ submitting: false })

      // 显示充值成功弹窗
      wx.showModal({
        title: '🎉 充值成功',
        content: `已升级为${data.levelName}会员\n余额：¥${data.wallet.balance}\n赠送优惠券：${data.couponCount}张`,
        showCancel: false,
        confirmText: '好的'
      })

      // 刷新钱包
      this.loadWallet()
    }).catch(() => {
      this.setData({ submitting: false })
    })
  }
})
