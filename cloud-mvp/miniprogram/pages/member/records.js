// pages/member/records.js
// 充值记录 — 查看充值历史

const api = require('../../utils/api')

Page({
  data: {
    merchantId: '',
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    noMore: false
  },

  onLoad(options) {
    if (options.merchantId) {
      this.setData({ merchantId: options.merchantId })
    }
    this.loadRecords(true)
  },

  // 加载充值记录
  loadRecords(refresh) {
    if (this.data.loading) return
    if (!refresh && this.data.noMore) return

    const page = refresh ? 1 : this.data.page
    this.setData({ loading: true })

    api.call('wallet', {
      action: 'rechargeList',
      merchantId: this.data.merchantId,
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
    this.loadRecords(true)
    wx.stopPullDownRefresh()
  },

  // 触底加载更多
  onReachBottom() {
    this.loadRecords(false)
  },

  // 格式化时间（wxml 无法直接调用方法，用 wxs 或 data 预处理）
  formatTime(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
})
