// pages/shop/detail.js
// 店铺详情页 — 用户端只读展示

const dateUtil = require('../../utils/date')

Page({
  data: {
    shop: null,
    activities: [],
    loading: true
  },

  onLoad(options) {
    const shopId = options.id
    if (shopId) {
      this.loadShop(shopId)
    } else {
      // MVP 单店，无 id 时加载第一家
      this.loadDefaultShop()
    }
  },

  loadDefaultShop() {
    const db = wx.cloud.database()
    db.collection('merchants').limit(1).get().then(res => {
      if (res.data.length > 0) {
        this.setData({ shop: res.data[0], loading: false })
        wx.setNavigationBarTitle({ title: res.data[0].name || '店铺详情' })
        this.loadActivities(res.data[0]._id)
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '店铺不存在', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  loadShop(id) {
    const db = wx.cloud.database()
    db.collection('merchants').doc(id).get().then(res => {
      this.setData({ shop: res.data, loading: false })
      wx.setNavigationBarTitle({ title: res.data.name || '店铺详情' })
      this.loadActivities(id)
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '店铺不存在', icon: 'none' })
    })
  },

  // 加载本周活动
  loadActivities(merchantId) {
    const db = wx.cloud.database()
    const _ = db.command
    const week = dateUtil.getWeekRange(0)

    // 先查该门店的活动
    db.collection('activities')
      .where({ merchantId, status: 'active' })
      .limit(20)
      .get()
      .then(actRes => {
        if (actRes.data.length === 0) return
        const activityIds = actRes.data.map(a => a._id)
        const activityMap = {}
        actRes.data.forEach(a => { activityMap[a._id] = a })

        // 查这些活动在本周的团期
        return db.collection('schedules')
          .where({
            activityId: _.in(activityIds),
            date: _.gte(week.start.toISOString()).and(_.lte(week.end.toISOString())),
            status: 'active'
          })
          .orderBy('date', 'asc')
          .limit(10)
          .get()
          .then(schRes => {
            const activities = schRes.data.map(s => {
              const act = activityMap[s.activityId] || {}
              return {
                ...act,
                scheduleId: s._id,
                date: s.date,
                maxSlots: s.maxSlots,
                bookedSlots: s.bookedSlots,
                dateFormatted: dateUtil.formatDate(s.date),
                slotsLeft: (s.maxSlots || 0) - (s.bookedSlots || 0)
              }
            })
            this.setData({ activities })
          })
      })
      .catch(err => console.error('加载活动失败:', err))
  },

  // 预览相册
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.shop.images[index],
      urls: this.data.shop.images
    })
  },

  // 跳转活动详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    const scheduleId = e.currentTarget.dataset.scheduleid
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&scheduleId=${scheduleId}`
    })
  },

  // 导航到店
  openNavigation() {
    const shop = this.data.shop
    if (shop.latitude && shop.longitude) {
      wx.openLocation({
        latitude: shop.latitude,
        longitude: shop.longitude,
        name: shop.name || '门店',
        address: shop.address || ''
      })
    } else if (shop.address) {
      wx.showToast({ title: shop.address, icon: 'none', duration: 3000 })
    }
  },

  // 拨打电话
  callShop() {
    const phone = this.data.shop.phone
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone, fail: () => {} })
    } else {
      wx.showToast({ title: '暂无联系电话', icon: 'none' })
    }
  }
})
