const api = require('../../utils/api')
const dateUtil = require('../../utils/date')

const TYPE_MAP = {
  fishing: '钓鱼团',
  camping: '露营套餐',
  family: '亲子出游',
  senior: '慢游团',
  wild_fishing: '野钓探险'
}

Page({
  data: {
    shopInfo: {},
    activities: [],
    loading: true,
    weekOffset: 0, // 0=本周, 1=下周, -1=上周
    weekLabel: '本周'
  },

  onShow() {
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

    db.collection('activities')
      .where({
        date: _.gte(week.start.toISOString()).and(_.lte(week.end.toISOString())),
        status: 'active' // 只显示上架的
      })
      .orderBy('date', 'asc')
      .limit(20)
      .get()
      .then(res => {
        const activities = res.data.map(item => ({
          ...item,
          typeName: TYPE_MAP[item.type] || item.type,
          dateFormatted: dateUtil.formatDate(item.date),
          slotsLeft: (item.maxSlots || 0) - (item.bookedSlots || 0)
        }))
        this.setData({ activities, loading: false })
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
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 跳转管理页
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadActivities()
    wx.stopPullDownRefresh()
  }
})
