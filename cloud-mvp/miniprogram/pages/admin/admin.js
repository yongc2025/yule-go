const app = getApp()

Page({
  data: {
    isAdmin: false,
    password: '',
    checkinCode: '',
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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // 今日订单数 + 营收
    // createdAt 存的是 db.serverDate()，用 Date 对象查询
    db.collection('orders')
      .where({
        createdAt: _.gte(todayStart).and(_.lte(todayEnd)),
        status: _.in(['paid', 'completed', 'refunded'])
      })
      .get()
      .then(res => {
        const paidOrders = res.data.filter(o => o.status === 'paid' || o.status === 'completed')
        const todayOrders = paidOrders.length
        const todayRevenue = paidOrders.reduce((sum, o) => sum + (o.totalFee || 0), 0)
        this.setData({
          'stats.todayOrders': todayOrders,
          'stats.todayRevenue': todayRevenue
        })
      })
      .catch(err => console.error('今日订单查询失败:', err))

    // 待核销数（已支付未核销）
    db.collection('orders')
      .where({ status: 'paid' })
      .count()
      .then(res => {
        this.setData({ 'stats.pendingCheckin': res.total })
      })
      .catch(err => console.error('待核销查询失败:', err))

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
      .catch(err => console.error('团期查询失败:', err))

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
      .catch(err => console.error('最近订单查询失败:', err))
  },

  // 跳转店铺设置
  goShopEdit() {
    wx.navigateTo({ url: '/pages/admin/shop-edit' })
  },

  // 跳转活动管理
  goActivities() {
    wx.navigateTo({ url: '/pages/admin/activities' })
  },

  // 跳转财务统计
  goFinance() {
    wx.navigateTo({ url: '/pages/admin/finance' })
  },

  // 跳转核销页（扫码）
  goCheckin() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        console.log('[scanCode] result:', res.result, 'type:', typeof res.result)
        const code = String(res.result || '').trim()
        if (code) {
          this._doCheckin(code)
        } else {
          wx.showToast({ title: '未识别到内容', icon: 'none' })
        }
      },
      fail: (err) => {
        console.warn('[scanCode] fail:', err)
        wx.showToast({ title: '扫码取消', icon: 'none' })
      }
    })
  },

  // 输入核销码
  onInputCheckinCode(e) {
    this.setData({ checkinCode: e.detail.value })
  },

  // 手动核销
  manualCheckin() {
    const code = this.data.checkinCode.trim()
    if (!code) {
      wx.showToast({ title: '请输入核销码', icon: 'none' })
      return
    }
    this._doCheckin(code)
  },

  // 执行核销
  _doCheckin(checkinCode) {
    // 确保核销码是字符串
    checkinCode = String(checkinCode).trim()
    console.log('[_doCheckin] checkinCode:', checkinCode, 'length:', checkinCode.length)

    wx.showLoading({ title: '核销中...' })

    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'checkin',
        data: {
          action: 'manual',
          checkinCode: checkinCode
        },
        success: (res) => {
          wx.hideLoading()
          const result = res.result
          if (result.code === 0) {
            const d = result.data
            wx.showModal({
              title: '✅ 核销成功',
              content: `订单号：${d.orderNo}\n活动：${d.activityName}\n联系人：${d.contactName}\n人数：${d.adults}成人${d.children > 0 ? ' + ' + d.children + '儿童' : ''}\n金额：¥${d.totalFee}`,
              showCancel: false,
              confirmText: '确定'
            })
            this.setData({ checkinCode: '' })
            this.loadDashboard()
          } else {
            wx.showModal({
              title: '核销失败',
              content: result.message || '核销码无效',
              showCancel: false
            })
          }
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('核销调用失败:', err)
          wx.showToast({ title: '核销失败，请重试', icon: 'none' })
        }
      })
    } else {
      wx.hideLoading()
      wx.showToast({ title: '请使用支持云开发的环境', icon: 'none' })
    }
  }
})
