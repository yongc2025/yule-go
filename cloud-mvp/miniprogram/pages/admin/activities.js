// pages/admin/activities.js
// 活动管理 — 列表 + 创建

const app = getApp()

Page({
  data: {
    activities: [],
    loading: true,
    showForm: false,
    editId: '',
    form: {
      name: '',
      type: 'fishing',
      price: '',
      childPrice: '',
      maxSlots: '20'
    },
    typeOptions: [
      { value: 'fishing', label: '🎣 钓鱼' },
      { value: 'camping', label: '⛺ 露营' },
      { value: 'family', label: '👨‍👩‍👧 亲子' },
      { value: 'senior', label: '👴 慢游' },
      { value: 'wild_fishing', label: '🎣 野钓' }
    ]
  },

  onShow() {
    this.loadActivities()
  },

  loadActivities() {
    this.setData({ loading: true })
    const db = wx.cloud.database()
    db.collection('activities')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
      .then(res => {
        const TYPE_MAP = {
          fishing: '🎣 钓鱼', camping: '⛺ 露营', family: '👨‍👩‍👧 亲子',
          senior: '👴 慢游', wild_fishing: '🎣 野钓'
        }
        const activities = res.data.map(a => ({
          ...a,
          typeLabel: TYPE_MAP[a.type] || a.type
        }))
        this.setData({ activities, loading: false })
      })
      .catch(err => {
        console.error('加载活动失败:', err)
        this.setData({ loading: false })
      })
  },

  // 打开新建表单
  showCreateForm() {
    this.setData({
      showForm: true,
      editId: '',
      form: { name: '', type: 'fishing', price: '', childPrice: '', maxSlots: '20' }
    })
  },

  // 打开编辑表单
  editActivity(e) {
    const id = e.currentTarget.dataset.id
    const activity = this.data.activities.find(a => a._id === id)
    if (!activity) return
    this.setData({
      showForm: true,
      editId: id,
      form: {
        name: activity.name || '',
        type: activity.type || 'fishing',
        price: String(activity.price || ''),
        childPrice: String(activity.childPrice || ''),
        maxSlots: String(activity.maxSlots || 20)
      }
    })
  },

  closeForm() {
    this.setData({ showForm: false, editId: '' })
  },

  onInputName(e) { this.setData({ 'form.name': e.detail.value }) },
  onInputPrice(e) { this.setData({ 'form.price': e.detail.value }) },
  onInputChildPrice(e) { this.setData({ 'form.childPrice': e.detail.value }) },
  onInputMaxSlots(e) { this.setData({ 'form.maxSlots': e.detail.value }) },

  changeType(e) {
    const idx = e.detail.value
    this.setData({ 'form.type': this.data.typeOptions[idx].value })
  },

  // 提交
  submitForm() {
    const { form, editId } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' })
      return
    }
    if (!form.price || isNaN(form.price)) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const data = {
      name: form.name.trim(),
      type: form.type,
      price: parseFloat(form.price),
      childPrice: parseFloat(form.childPrice) || 0,
      maxSlots: parseInt(form.maxSlots) || 20
    }

    const db = wx.cloud.database()
    const action = editId ? 'update' : 'create'
    const callData = editId ? { id: editId, ...data } : data

    wx.cloud.callFunction({
      name: 'activities',
      data: { action, data: callData }
    }).then(res => {
      wx.hideLoading()
      if (res.result.code === 0) {
        wx.showToast({ title: editId ? '已更新' : '已创建', icon: 'success' })
        this.setData({ showForm: false, editId: '' })
        this.loadActivities()
      } else {
        wx.showToast({ title: res.result.message || '保存失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('保存活动失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  // 删除
  deleteActivity(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database()
          db.collection('activities').doc(id).update({
            data: { status: 'deleted', updatedAt: db.serverDate() }
          }).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadActivities()
          })
        }
      }
    })
  },

  goSchedules(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.navigateTo({
      url: `/pages/admin/schedules?activityId=${id}&activityName=${encodeURIComponent(name)}`
    })
  }
})
