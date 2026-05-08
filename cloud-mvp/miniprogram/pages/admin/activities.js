// pages/admin/activities.js
// 活动管理 — 列表页（编辑跳转独立页面）

const app = getApp()

Page({
  data: {
    activities: [],
    loading: true
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

  // 新建活动 → 跳转编辑页
  showCreateForm() {
    wx.navigateTo({ url: '/pages/admin/activity-edit' })
  },

  // 编辑活动 → 跳转编辑页
  editActivity(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/admin/activity-edit?id=${id}` })
  },

  // 删除（走云函数，确保权限）
  deleteActivity(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          wx.cloud.callFunction({
            name: 'activities',
            data: { action: 'update', data: { id, status: 'deleted' } }
          }).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadActivities()
          }).catch(err => {
            wx.hideLoading()
            console.error('删除失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
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
