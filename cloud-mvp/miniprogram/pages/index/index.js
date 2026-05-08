const api = require('../../utils/api')
const dateUtil = require('../../utils/date')

const TYPE_MAP = {
  fishing: '钓鱼团',
  camping: '露营套餐',
  family: '亲子出游',
  senior: '慢游团',
  wild_fishing: '野钓探险'
}

const TYPE_ICON_MAP = {
  fishing: '🎣',
  camping: '⛺',
  family: '👨‍👩‍👧',
  senior: '👴',
  wild_fishing: '🎣'
}

Page({
  data: {
    shopInfo: {},
    activities: [],
    loading: true,
    weekOffset: 0, // 0=本周, 1=下周, -1=上周
    weekLabel: '本周',
    isAdmin: false
  },

  onShow() {
    // 检查管理员身份
    const app = getApp()
    this.setData({ isAdmin: app.globalData.isAdmin })
    this.loadShopInfo()
    this.loadActivities()
  },

  // 加载门店信息
  loadShopInfo() {
    const db = wx.cloud.database()
    // MVP: 只有一家店，直接取第一条
    db.collection('merchants').limit(1).get().then(res => {
      if (res.data.length > 0) {
        this.setData({ shopInfo: res.data[0] })
      }
    })
  },

  // 加载活动列表
  loadActivities() {
    this.setData({ loading: true })
    const week = dateUtil.getWeekRange(this.data.weekOffset)

    this.setData({
      weekLabel: this.data.weekOffset === 0 ? '本周' :
                 this.data.weekOffset === 1 ? '下周' :
                 this.data.weekOffset === -1 ? '上周' :
                 `${week.start.getMonth() + 1}月第${dateUtil.getWeekNumber(week.start)}周`
    })

    const db = wx.cloud.database()
    const _ = db.command

    // 1. 先查本周的团期
    db.collection('schedules')
      .where({
        date: _.gte(week.start.toISOString()).and(_.lte(week.end.toISOString())),
        status: 'active'
      })
      .orderBy('date', 'asc')
      .limit(20)
      .get()
      .then(res => {
        const schedules = res.data
        if (schedules.length === 0) {
          this.setData({ activities: [], loading: false })
          return
        }

        // 2. 去重获取活动ID
        const activityIds = [...new Set(schedules.map(s => s.activityId))]

        // 3. 查询活动详情
        db.collection('activities')
          .where({ _id: _.in(activityIds), status: 'active' })
          .get()
          .then(actRes => {
            const activityMap = {}
            actRes.data.forEach(a => { activityMap[a._id] = a })

            // 4. 合并团期信息到活动
            const activities = schedules.map(schedule => {
              const activity = activityMap[schedule.activityId] || {}
              return {
                ...activity,
                scheduleId: schedule._id,
                date: schedule.date,
                maxSlots: schedule.maxSlots,
                bookedSlots: schedule.bookedSlots,
                typeName: TYPE_MAP[activity.type] || activity.type,
                typeIcon: TYPE_ICON_MAP[activity.type] || '🎣',
                dateFormatted: dateUtil.formatDate(schedule.date),
                slotsLeft: (schedule.maxSlots || 0) - (schedule.bookedSlots || 0)
              }
            })

            this.setData({ activities, loading: false })
          })
      })
      .catch(err => {
        console.error('加载活动失败:', err)
        this.setData({ loading: false })
      })
  },

  // 上一周
  prevWeek() {
    this.setData({ weekOffset: this.data.weekOffset - 1 })
    this.loadActivities()
  },

  // 下一周
  nextWeek() {
    this.setData({ weekOffset: this.data.weekOffset + 1 })
    this.loadActivities()
  },

  // 回到本周
  backThisWeek() {
    if (this.data.weekOffset !== 0) {
      this.setData({ weekOffset: 0 })
      this.loadActivities()
    }
  },

  // 跳转活动详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    const scheduleId = e.currentTarget.dataset.scheduleid
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&scheduleId=${scheduleId}`
    })
  },

  // 跳转管理页
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  // 导航到门店
  openNavigation() {
    const shop = this.data.shopInfo
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

  // 拨打门店电话
  callShop() {
    const phone = this.data.shopInfo.phone
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone, fail: () => {} })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadActivities()
    wx.stopPullDownRefresh()
  }
})
