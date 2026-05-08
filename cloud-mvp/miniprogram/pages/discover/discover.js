// pages/discover/discover.js

Page({
  data: {
    shops: [],
    loading: true,
    currentType: 'all'
  },

  onShow() {
    this.loadShops()
  },

  // 加载门店列表
  loadShops() {
    this.setData({ loading: true })
    const db = wx.cloud.database()

    db.collection('merchants')
      .limit(20)
      .get()
      .then(res => {
        const shops = res.data
        // 为每个门店加载本周活动数
        const promises = shops.map(shop =>
          db.collection('activities')
            .where({ merchantId: shop._id, status: 'active' })
            .limit(5)
            .get()
            .then(r => ({
              ...shop,
              activityCount: r.data.length,
              hotActivity: r.data.length > 0 ? r.data[0] : null
            }))
        )
        return Promise.all(promises)
      })
      .then(shops => {
        this.setData({ shops, loading: false })
      })
      .catch(err => {
        console.error('加载门店失败:', err)
        this.setData({ loading: false })
      })
  },

  // 切换分类
  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentType: type })
    // MVP 简化：暂不过滤，V2 实现分类筛选
  },

  // 跳转门店（回到首页）
  goShop(e) {
    // MVP：跳转到首页查看该店活动
    wx.switchTab({ url: '/pages/index/index' })
  },

  onPullDownRefresh() {
    this.loadShops()
    wx.stopPullDownRefresh()
  }
})
