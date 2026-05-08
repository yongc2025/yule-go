// pages/profile/profile.js

const app = getApp()

Page({
  data: {
    userInfo: {},
    myShops: []
  },

  onShow() {
    this.loadUserInfo()
    this.loadMyShops()
  },

  // 加载用户信息
  loadUserInfo() {
    // 尝试从缓存获取
    let userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      userInfo = {
        nickName: '钓鱼爱好者',
        avatarUrl: '/images/default-avatar.png'
      }
    }
    this.setData({ userInfo })
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

        // 加载门店详情
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
