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
        album: user.album || [],
        memberLevel: user.memberLevel || 0,
        balance: user.balance || 0
      }
      this.setData({ userInfo, loading: false })
      // 同步缓存
      wx.setStorageSync('userInfo', {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      })
    }).catch(() => {
      // 降级：缓存
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

  // 加载我的门店
  loadMyShops() {
    const openid = app.globalData.openid
    if (!openid) return

    const db = wx.cloud.database()
    db.collection('user_shops')
      .where({ openid })
      .orderBy('lastVisit', 'desc')
      .limit(10)
      .get()
      .then(res => {
        const relations = res.data
        if (relations.length === 0) {
          this.setData({ myShops: [] })
          return
        }

        const promises = relations.map(rel =>
          db.collection('merchants').doc(rel.merchantId).get()
            .then(r => ({
              ...r.data,
              isPrimary: rel.isPrimary,
              visitCount: rel.visitCount,
              lastVisit: rel.lastVisit
            }))
            .catch(() => null)
        )
        return Promise.all(promises)
      })
      .then(shops => {
        if (shops) {
          this.setData({ myShops: shops.filter(Boolean) })
        }
      })
      .catch(err => {
        console.error('加载我的门店失败:', err)
      })
  },

  // 跳转编辑资料
  goEdit() {
    wx.navigateTo({ url: '/pages/profile/edit' })
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
