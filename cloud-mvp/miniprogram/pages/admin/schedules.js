// pages/admin/schedules.js
// 团期管理 — 为指定活动创建/查看团期

Page({
  data: {
    activityId: '',
    activityName: '',
    schedules: [],
    loading: true,
    showForm: false,
    form: {
      date: '',
      maxSlots: ''
    }
  },

  onLoad(options) {
    this.setData({
      activityId: options.activityId || '',
      activityName: decodeURIComponent(options.activityName || '')
    })
  },

  onShow() {
    this.loadSchedules()
  },

  loadSchedules() {
    this.setData({ loading: true })
    const db = wx.cloud.database()
    db.collection('schedules')
      .where({ activityId: this.data.activityId })
      .orderBy('date', 'desc')
      .limit(50)
      .get()
      .then(res => {
        const STATUS_MAP = {
          active: '报名中', full: '已满', cancelled: '已取消', completed: '已完成'
        }
        const schedules = res.data.map(s => ({
          ...s,
          statusText: STATUS_MAP[s.status] || s.status,
          dateFormatted: s.date ? s.date.substring(0, 10) : '',
          slotsLeft: (s.maxSlots || 0) - (s.bookedSlots || 0)
        }))
        this.setData({ schedules, loading: false })
      })
      .catch(err => {
        console.error('加载团期失败:', err)
        this.setData({ loading: false })
      })
  },

  showCreateForm() {
    // 默认选下个周六
    const now = new Date()
    const day = now.getDay()
    const daysUntilSat = (6 - day + 7) % 7 || 7
    const nextSat = new Date(now.getTime() + daysUntilSat * 86400000)
    const dateStr = nextSat.toISOString().substring(0, 10)

    this.setData({
      showForm: true,
      form: { date: dateStr, maxSlots: '20' }
    })
  },

  closeForm() {
    this.setData({ showForm: false })
  },

  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value })
  },

  onInputMaxSlots(e) {
    this.setData({ 'form.maxSlots': e.detail.value })
  },

  submitForm() {
    const { form, activityId, activityName } = this.data
    if (!form.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' })
      return
    }

    // 校验是否周末
    const d = new Date(form.date)
    const day = d.getDay()
    if (day !== 0 && day !== 6) {
      wx.showModal({
        title: '提示',
        content: '团期日期通常为周末（周六/周日），确定继续吗？',
        success: (res) => {
          if (res.confirm) this._doCreateSchedule()
        }
      })
      return
    }
    this._doCreateSchedule()
  },

  _doCreateSchedule() {
    const { form, activityId, activityName } = this.data
    wx.showLoading({ title: '创建中...' })

    const db = wx.cloud.database()
    db.collection('schedules').add({
      data: {
        activityId: activityId,
        activityName: activityName,
        date: form.date,
        maxSlots: parseInt(form.maxSlots) || 20,
        bookedSlots: 0,
        status: 'active',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '团期已创建', icon: 'success' })
      this.setData({ showForm: false })
      this.loadSchedules()
    }).catch(err => {
      wx.hideLoading()
      console.error('创建团期失败:', err)
      wx.showToast({ title: '创建失败', icon: 'none' })
    })
  },

  cancelSchedule(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '取消后该团期不再接受报名',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database()
          db.collection('schedules').doc(id).update({
            data: { status: 'cancelled', updatedAt: db.serverDate() }
          }).then(() => {
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadSchedules()
          })
        }
      }
    })
  },

  deleteSchedule(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database()
          db.collection('schedules').doc(id).remove().then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadSchedules()
          })
        }
      }
    })
  }
})
