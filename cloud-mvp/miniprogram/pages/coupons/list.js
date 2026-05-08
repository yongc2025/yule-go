// pages/coupons/list.js
// 我的优惠券 — 可用/已用/过期 Tab 切换

const api = require('../../utils/api')

Page({
  data: {
    tabs: [
      { key: 'unused', name: '可用' },
      { key: 'used', name: '已使用' },
      { key: 'expired', name: '已过期' }
    ],
    activeTab: 'unused',
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadCoupons(true)
  },

  onShow() {
    this.loadCoupons(true)
  },

  // 切换 Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    this.setData({ activeTab: tab, list: [], page: 1, noMore: false })
    this.loadCoupons(true)
  },

  // 加载优惠券
  loadCoupons(refresh) {
    if (this.data.loading) return
    if (!refresh && this.data.noMore) return

    const page = refresh ? 1 : this.data.page
    this.setData({ loading: true })

    api.call('coupons', {
      action: 'list',
      status: this.data.activeTab,
      page,
      pageSize: this.data.pageSize
    }, { showLoading: false }).then(data => {
      const list = refresh ? data.list : [...this.data.list, ...data.list]
      this.setData({
        list,
        total: data.total,
        page: page + 1,
        loading: false,
        noMore: list.length >= data.total
      })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCoupons(true)
    wx.stopPullDownRefresh()
  },

  // 触底加载
  onReachBottom() {
    this.loadCoupons(false)
  }
})
