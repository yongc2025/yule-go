// pages/invite/invite.js
// 邀请好友 — 老带新裂变

const api = require('../../utils/api')

Page({
  data: {
    inviteCode: '',
    totalReward: 0,
    completedCount: 0,
    pendingCount: 0,
    inviteList: [],
    loading: true
  },

  onLoad() {
    this.loadInviteInfo()
  },

  onPullDownRefresh() {
    this.loadInviteInfo().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载邀请信息
  async loadInviteInfo() {
    this.setData({ loading: true })
    try {
      const res = await api.call('referral', { action: 'getInviteInfo' }, { showLoading: false })
      if (res.code === 0) {
        const { inviteCode, totalReward, completedCount, pendingCount, list } = res.data

        // 格式化邀请记录时间
        const inviteList = (list || []).map(item => ({
          ...item,
          createdAtText: this.formatTime(item.createdAt)
        }))

        this.setData({
          inviteCode: inviteCode || '',
          totalReward: totalReward || 0,
          completedCount: completedCount || 0,
          pendingCount: pendingCount || 0,
          inviteList,
          loading: false
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: res.message || '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('加载邀请信息失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
  },

  // 复制邀请码
  copyCode() {
    if (!this.data.inviteCode) return
    wx.setClipboardData({
      data: this.data.inviteCode,
      success() {
        wx.showToast({ title: '邀请码已复制', icon: 'success' })
      }
    })
  },

  // 分享给好友（微信转发）
  onShareAppMessage() {
    return {
      title: `🎣 我的邀请码是 ${this.data.inviteCode}，一起来钓鱼吧！`,
      path: `/pages/index/index?inviteCode=${this.data.inviteCode}`,
      imageUrl: '' // 可设置自定义分享图
    }
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date

    // 1小时内
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000)
      return mins <= 0 ? '刚刚' : `${mins}分钟前`
    }
    // 24小时内
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    }
    // 7天内
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`
    }
    // 更早
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
})
