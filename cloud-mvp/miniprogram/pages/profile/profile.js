// pages/profile/profile.js
// 我的 — 个人中心（从云端加载用户信息）

const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    userInfo: {},
    myShops: [],
    loading: true
  },

  onShow() {
    this.loadUserInfo()
    this.loadMyShops()
  },

  // 从云端加载用户信息
  loadUserInfo() {
    this.setData({ loading: true })
    api.call('users', { action: 'getProfile' }, { showLoading: false }).then(user => {
      const userInfo = {
        nickName: user.nickname || '钓鱼爱好者',
        avatarUrl: user.avatar || '/images/default-avatar.png',
        phone: user.phone || '',
        bio: user.bio || '',
        album: user.album || []
      }
      this.setData({ userInfo, loading: false })
      wx.setStorageSync('userInfo', {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      })
    }).catch(() => {
      const cached = wx.getStorageSync('userInfo') || {}
      this.setData({
        userInfo: {
          nickName: cached.nickName || '钓鱼爱好者',
          avatarUrl: cached.avatarUrl || '/images/default-avatar.png'
        },
        loading: false
      })
    })
  },

  // 加载我的门店（含钱包信息）
  loadMyShops() {
    const db = wx.cloud.database()

    // 先加载所有门店
    db.collection('merchants').limit(20).get().then(merchRes => {
      const merchants = merchRes.data
      if (merchants.length === 0) {
        this.setData({ myShops: [] })
        return
      }

      // 查询每个门店的钱包
      const promises = merchants.map(shop =>
        api.call('wallet', {
          action: 'getWallet',
          merchantId: shop._id
        }, { showLoading: false }).then(wallet => ({
          ...shop,
          wallet: wallet
        })).catch(() => ({
          ...shop,
          wallet: { balance: 0, memberLevel: 0, memberName: '普通用户', travelDiscount: 0 }
        }))
      )
      return Promise.all(promises)
    }).then(shops => {
      if (shops) {
        this.setData({ myShops: shops })
      }
    }).catch(err => {
      console.error('加载门店失败:', err)
    })
  },

  // 跳转编辑资料
  goEdit() {
    wx.navigateTo({ url: '/pages/profile/edit' })
  },

  // 跳转充值记录
  goRecords(e) {
    const merchantId = e.currentTarget.dataset.shopid
    wx.navigateTo({ url: `/pages/member/records?merchantId=${merchantId}` })
  },

  // 跳转充值中心
  goRecharge(e) {
    const merchantId = e.currentTarget.dataset.shopid
    wx.navigateTo({ url: `/pages/member/recharge?merchantId=${merchantId}` })
  },

  // 跳转订单页
  goOrders() {
    wx.switchTab({ url: '/pages/orders/orders' })
  },

  // 联系客服
  callService() {
    wx.makePhoneCall({
      phoneNumber: '13800138000',
      fail: () => {}
    })
  },

  // 发现新门店
  goDiscover() {
    wx.switchTab({ url: '/pages/discover/discover' })
  },

  // 店主管理后台
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  }
})
