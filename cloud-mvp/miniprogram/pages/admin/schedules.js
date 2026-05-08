// pages/admin/schedules.js
// 团期管理 — 支持批量创建 + 编辑 + picker 防穿透

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
      maxSlots: '20'
    },
    tempDate: '',
    pickerOpen: false
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
      pickerOpen: false
    })
  },

  closeForm() {
    // picker 弹出时禁止关闭弹窗（防穿透）
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
    // 延迟关闭，给 bindchange 时间先触发
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
      // 周六
      const sat = new Date(now)
      sat.setDate(now.getDate() + (6 - now.getDay() + 7) % 7 + week * 7)
      const satStr = sat.toISOString().substring(0, 10)
      if (!dates.includes(satStr)) dates.push(satStr)

      // 周日
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

  // ===== 名额 =====

  onInputMaxSlots(e) {
    this.setData({ 'form.maxSlots': e.detail.value })
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
      this._updateSchedule(editId, form.date, parseInt(form.maxSlots) || 20)
    } else {
      // 批量创建模式
      if (form.dates.length === 0) {
        wx.showToast({ title: '请至少添加一个日期', icon: 'none' })
        return
      }
      this._batchCreateSchedules()
    }
  },

  _updateSchedule(id, date, maxSlots) {
    wx.showLoading({ title: '保存中...' })
    const db = wx.cloud.database()
    db.collection('schedules').doc(id).update({
      data: { date, maxSlots, updatedAt: db.serverDate() }
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

    // 校验周末
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

        // 检查是否已存在
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

          db.collection('schedules').add({
            data: {
              activityId,
              activityName,
              date: form.dates[index],
              maxSlots,
              bookedSlots: 0,
              status: 'active',
              createdAt: db.serverDate(),
              updatedAt: db.serverDate()
            }
          }).then(() => {
            created++
            createNext(index + 1)
          }).catch(err => {
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

  // ===== 取消/删除 =====

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
