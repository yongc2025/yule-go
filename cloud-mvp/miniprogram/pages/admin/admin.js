const app = getApp()

Page({
  data: {
    isAdmin: false,
    password: '',
    stats: {
      todayOrders: 0,
      todayRevenue: 0,
      pendingCheckin: 0,
      weekSchedules: 0
    },
    todaySchedules: [],
    recentOrders: []
  },

  onShow() {
    // 检查管理员状态
    if (app.globalData.isAdmin) {
      this.setData({ isAdmin: true })
      this.loadDashboard()
    }
  },

  // 输入密码
  onInputPassword(e) {
    this.setData({ password: e.detail.value })
  },

  // 管理员登录（MVP 简化版：密码写在云数据库 admins 集合中）
  loginAdmin() {
    const password = this.data.password.trim()
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    const db = wx.cloud.database()
    db.collection('admins').where({
      password: password
    }).get().then(res => {
      if (res.data.length > 0) {
        app.globalData.isAdmin = true
        this.setData({ isAdmin: true })
        this.loadDashboard()
      } else {
        wx.showToast({ title: '密码错误', icon: 'none' })
      }
    })
  },

  // 加载管理面板数据
  loadDashboard() {
    const db = wx.cloud.database()
    const _ = db.command
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // 今日订单数 + 营收
    db.collection('orders')
      .where({
        createdAt: _.gte(todayStart.toISOString()).and(_.lte(todayEnd.toISOString())),
        status: _.in(['paid', 'completed'])
      })
      .get()
      .then(res => {
        const todayOrders = res.data.length
        const todayRevenue = res.data.reduce((sum, o) => sum + (o.totalFee || 0), 0)
        this.setData({
          'stats.todayOrders': todayOrders,
          'stats.todayRevenue': todayRevenue
        })
      })

    // 待核销数
    db.collection('orders')
      .where({ status: 'paid' })
      .count()
      .then(res => {
        this.setData({ 'stats.pendingCheckin': res.total })
      })

    // 本周团期
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    db.collection('schedules')
      .where({
        date: _.gte(weekStart.toISOString()).and(_.lte(weekEnd.toISOString())),
        status: 'active'
      })
      .get()
      .then(res => {
        this.setData({
          'stats.weekSchedules': res.data.length,
          todaySchedules: res.data.filter(s => {
            const d = new Date(s.date)
            return d >= todayStart && d <= todayEnd
          })
        })
      })

    // 最近 5 笔订单
    db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()
      .then(res => {
        const STATUS_MAP = {
          pending: '待支付', paid: '已支付', cancelled: '已取消',
          completed: '已完成', refunding: '退款中', refunded: '已退款'
        }
        const recentOrders = res.data.map(o => ({
          ...o,
          statusText: STATUS_MAP[o.status] || o.status
        }))
        this.setData({ recentOrders })
      })
  },

  // 跳转核销页（TODO: 实现扫码核销）
  goCheckin() {
    wx.showToast({ title: '核销功能开发中', icon: 'none' })
  }
})
