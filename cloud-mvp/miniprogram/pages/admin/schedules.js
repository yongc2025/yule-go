// pages/admin/schedules.js
// 团期管理 — 支持批量创建 + 编辑(日期/名额/集合地点) + 取消(含自动退款)

const api = require('../../utils/api')

Page({
  data: {
    activityId: '',
    activityName: '',
    schedules: [],
    loading: true,
    showForm: false,
    editId: '',
    form: {
      date: '',
      dates: [],
      maxSlots: '20',
      location: ''
    },
    tempDate: '',
    pickerOpen: false,
    // 变更记录
    showChangelog: false,
    changelog: []
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
          slotsLeft: (s.maxSlots || 0) - (s.bookedSlots || 0),
          hasLocation: !!(s.location && s.location.trim())
        }))
        this.setData({ schedules, loading: false })
      })
      .catch(err => {
        console.error('加载团期失败:', err)
        this.setData({ loading: false })
      })
  },

  // ===== 弹窗控制 =====

  showCreateForm() {
    const now = new Date()
    const day = now.getDay()
    const daysUntilSat = (6 - day + 7) % 7 || 7
    const nextSat = new Date(now.getTime() + daysUntilSat * 86400000)
    const dateStr = nextSat.toISOString().substring(0, 10)

    this.setData({
      showForm: true,
      editId: '',
      'form.date': '',
      'form.dates': [dateStr],
      'form.maxSlots': '20',
      'form.location': '',
      tempDate: '',
      pickerOpen: false
    })
  },

  editSchedule(e) {
    const id = e.currentTarget.dataset.id
    const schedule = this.data.schedules.find(s => s._id === id)
    if (!schedule) return

    this.setData({
      showForm: true,
      editId: id,
      'form.date': schedule.dateFormatted,
      'form.dates': [],
      'form.maxSlots': String(schedule.maxSlots || 20),
      'form.location': schedule.location || '',
      pickerOpen: false
    })
  },

  closeForm() {
    if (this.data.pickerOpen) return
    this.setData({ showForm: false, editId: '' })
  },

  // ===== Picker 防穿透 =====

  onPickerOpen() {
    if (this._pickerCloseTimer) {
      clearTimeout(this._pickerCloseTimer)
      this._pickerCloseTimer = null
    }
    this.setData({ pickerOpen: true })
  },

  onPickerClose() {
    this._pickerCloseTimer = setTimeout(() => {
      this.setData({ pickerOpen: false })
      this._pickerCloseTimer = null
    }, 300)
  },

  // ===== 日期选择（新建模式：多选） =====

  onTempDateChange(e) {
    if (this._pickerCloseTimer) {
      clearTimeout(this._pickerCloseTimer)
      this._pickerCloseTimer = null
    }
    const date = e.detail.value
    if (!date) {
      this.setData({ pickerOpen: false })
      return
    }

    const dates = this.data.form.dates
    if (dates.includes(date)) {
      wx.showToast({ title: '该日期已添加', icon: 'none' })
      this.setData({ pickerOpen: false })
      return
    }

    dates.push(date)
    dates.sort()
    this.setData({
      'form.dates': dates,
      pickerOpen: false
    })
  },

  removeDate(e) {
    const idx = e.currentTarget.dataset.index
    const dates = [...this.data.form.dates]
    dates.splice(idx, 1)
    this.setData({ 'form.dates': dates })
  },

  addNextWeekends() {
    const dates = [...this.data.form.dates]
    const now = new Date()

    for (let week = 0; week < 4; week++) {
      const sat = new Date(now)
      sat.setDate(now.getDate() + (6 - now.getDay() + 7) % 7 + week * 7)
      const satStr = sat.toISOString().substring(0, 10)
      if (!dates.includes(satStr)) dates.push(satStr)

      const sun = new Date(sat)
      sun.setDate(sat.getDate() + 1)
      const sunStr = sun.toISOString().substring(0, 10)
      if (!dates.includes(sunStr)) dates.push(sunStr)
    }

    dates.sort()
    this.setData({ 'form.dates': dates })
    wx.showToast({ title: `已添加 ${dates.length} 个日期`, icon: 'success' })
  },

  // ===== 日期选择（编辑模式：单选） =====

  onDateChange(e) {
    if (this._pickerCloseTimer) {
      clearTimeout(this._pickerCloseTimer)
      this._pickerCloseTimer = null
    }
    this.setData({
      'form.date': e.detail.value,
      pickerOpen: false
    })
  },

  // ===== 名额 / 集合地点 =====

  onInputMaxSlots(e) {
    this.setData({ 'form.maxSlots': e.detail.value })
  },

  onInputLocation(e) {
    this.setData({ 'form.location': e.detail.value })
  },

  // ===== 提交 =====

  submitForm() {
    const { form, editId, activityId, activityName } = this.data

    if (editId) {
      // 编辑模式
      if (!form.date) {
        wx.showToast({ title: '请选择日期', icon: 'none' })
        return
      }
      this._updateSchedule(editId, form.date, parseInt(form.maxSlots) || 20, form.location.trim())
    } else {
      // 批量创建模式
      if (form.dates.length === 0) {
        wx.showToast({ title: '请至少添加一个日期', icon: 'none' })
        return
      }
      this._batchCreateSchedules()
    }
  },

  _updateSchedule(id, date, maxSlots, location) {
    wx.showLoading({ title: '保存中...' })
    const db = wx.cloud.database()
    db.collection('schedules').doc(id).update({
      data: { date, maxSlots, location, updatedAt: db.serverDate() }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({ title: '已更新', icon: 'success' })
      this.setData({ showForm: false, editId: '' })
      this.loadSchedules()
    }).catch(err => {
      wx.hideLoading()
      console.error('更新失败:', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  _batchCreateSchedules() {
    const { form, activityId, activityName } = this.data
    const maxSlots = parseInt(form.maxSlots) || 20
    const location = form.location.trim()

    const nonWeekend = form.dates.filter(d => {
      const day = new Date(d).getDay()
      return day !== 0 && day !== 6
    })

    const doCreate = () => {
      wx.showLoading({ title: `创建中 0/${form.dates.length}` })
      const db = wx.cloud.database()

      let created = 0
      const total = form.dates.length
      const errors = []

      const createNext = (index) => {
        if (index >= total) {
          wx.hideLoading()
          if (errors.length > 0) {
            wx.showModal({
              title: '创建完成',
              content: `成功 ${created} 个，失败 ${errors.length} 个\n${errors.join('\n')}`,
              showCancel: false
            })
          } else {
            wx.showToast({ title: `已创建 ${created} 个团期`, icon: 'success' })
          }
          this.setData({ showForm: false })
          this.loadSchedules()
          return
        }

        wx.showLoading({ title: `创建中 ${index + 1}/${total}` })

        db.collection('schedules').where({
          activityId,
          date: form.dates[index],
          status: 'active'
        }).count().then(countRes => {
          if (countRes.total > 0) {
            errors.push(`${form.dates[index]} 已存在`)
            createNext(index + 1)
            return
          }

          const scheduleData = {
            activityId,
            activityName,
            date: form.dates[index],
            maxSlots,
            bookedSlots: 0,
            status: 'active',
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
          if (location) scheduleData.location = location

          db.collection('schedules').add({ data: scheduleData }).then(() => {
            created++
            createNext(index + 1)
          }).catch(() => {
            errors.push(`${form.dates[index]} 失败`)
            createNext(index + 1)
          })
        }).catch(() => {
          errors.push(`${form.dates[index]} 检查失败`)
          createNext(index + 1)
        })
      }

      createNext(0)
    }

    if (nonWeekend.length > 0) {
      wx.showModal({
        title: '提示',
        content: `${nonWeekend.join('、')} 不是周末，确定继续吗？`,
        success: (res) => {
          if (res.confirm) doCreate()
        }
      })
    } else {
      doCreate()
    }
  },

  // ===== 取消团期（含自动退款） =====

  cancelSchedule(e) {
    const id = e.currentTarget.dataset.id
    const schedule = this.data.schedules.find(s => s._id === id)
    if (!schedule) return

    const hasBooked = (schedule.bookedSlots || 0) > 0
    const content = hasBooked
      ? `该团期已有 ${schedule.bookedSlots} 人报名，取消后将自动全额退款并通知用户。\n\n确定取消？`
      : '取消后该团期不再接受报名。确定取消？'

    wx.showModal({
      title: '⚠️ 取消团期',
      content,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' })
          api.call('schedules', {
            action: 'cancel',
            id,
            reason: '店主取消团期'
          }, { showLoading: false }).then(data => {
            wx.hideLoading()
            let msg = '团期已取消'
            if (data.refundCount > 0) {
              msg += `\n已为 ${data.refundCount} 位用户退款 ¥${data.refundTotal}`
            }
            wx.showModal({
              title: '✅ 操作成功',
              content: msg,
              showCancel: false
            })
            this.loadSchedules()
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '取消失败', icon: 'none' })
          })
        }
      }
    })
  },

  // ===== 查看变更记录 =====

  showChangelog() {
    wx.showLoading({ title: '加载中...' })
    api.call('schedules', {
      action: 'changelog',
      activityId: this.data.activityId
    }, { showLoading: false }).then(data => {
      wx.hideLoading()
      const changelog = (data || []).map(item => ({
        ...item,
        timeFormatted: item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
        typeText: item.type === 'cancel' ? '❌ 取消' : '✏️ 编辑'
      }))
      this.setData({ showChangelog: true, changelog })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  closeChangelog() {
    this.setData({ showChangelog: false, changelog: [] })
  },

  // ===== 删除 =====

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
