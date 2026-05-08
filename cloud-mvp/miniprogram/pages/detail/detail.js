const dateUtil = require('../../utils/date')

Page({
  data: {
    activity: null,
    shopInfo: {},
    schedules: [],
    selectedSchedule: null,
    loading: true,
    allFull: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadActivity(options.id)
    }
  },

  // 加载活动详情
  loadActivity(id) {
    const db = wx.cloud.database()

    db.collection('activities').doc(id).get().then(res => {
      const activity = res.data
      this.setData({
        activity,
        loading: false
      })
      wx.setNavigationBarTitle({ title: activity.name })

      // 加载门店信息
      if (activity.merchantId) {
        db.collection('merchants').doc(activity.merchantId).get().then(r => {
          this.setData({ shopInfo: r.data })
        })
      }

      // 加载该活动的团期
      this.loadSchedules(id)
    }).catch(err => {
      console.error('加载活动失败:', err)
      wx.showToast({ title: '活动不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  // 加载团期
  loadSchedules(activityId) {
    const db = wx.cloud.database()
    const _ = db.command
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    db.collection('schedules')
      .where({
        activityId: activityId,
        date: _.gte(now.toISOString()),
        status: 'active'
      })
      .orderBy('date', 'asc')
      .limit(10)
      .get()
      .then(res => {
        const schedules = res.data.map(item => ({
          ...item,
          dateFormatted: dateUtil.formatDate(item.date),
          slotsLeft: (item.maxSlots || 0) - (item.bookedSlots || 0),
          selected: false
        }))
        // 判断是否所有档期都已满
        const allFull = schedules.length > 0 && schedules.every(s => s.slotsLeft <= 0)
        this.setData({ schedules, allFull })
      })
  },

  // 选择档期
  selectSchedule(e) {
    const index = e.currentTarget.dataset.index
    const schedule = this.data.schedules[index]

    if (schedule.slotsLeft <= 0) {
      wx.showToast({ title: '该档期已满', icon: 'none' })
      return
    }

    // 取消之前的选中
    const schedules = this.data.schedules.map((item, i) => ({
      ...item,
      selected: i === index
    }))

    this.setData({
      schedules,
      selectedSchedule: schedule
    })
  },

  // 导航到门店
  openNavigation() {
    const shop = this.data.shopInfo
    if (shop.latitude && shop.longitude) {
      wx.openLocation({
        latitude: shop.latitude,
        longitude: shop.longitude,
        name: shop.name || '集合地点',
        address: shop.address || ''
      })
    } else if (shop.address) {
      wx.showToast({ title: shop.address, icon: 'none', duration: 3000 })
    }
  },

  // 跳转预约
  goBooking() {
    if (this.data.allFull) {
      wx.showToast({ title: '所有档期已满', icon: 'none' })
      return
    }
    if (!this.data.selectedSchedule) {
      wx.showToast({ title: '请先选择档期', icon: 'none' })
      return
    }

    const { activity, selectedSchedule, shopInfo } = this.data

    // 传参数到预约页
    const params = encodeURIComponent(JSON.stringify({
      activityId: activity._id,
      activityName: activity.name,
      price: activity.price,
      childPrice: activity.childPrice || 0,
      scheduleId: selectedSchedule._id,
      scheduleDate: selectedSchedule.dateFormatted,
      shopName: shopInfo.name || ''
    }))

    wx.navigateTo({
      url: `/pages/booking/booking?data=${params}`
    })
  }
})
