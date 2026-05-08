// pages/admin/finance.js
// 财务统计 — 收支概览 + 退款订单 + 按团期对账

const api = require('../../utils/api')

Page({
  data: {
    currentRange: 'today',
    summary: {},
    bySchedule: [],
    refundList: [],
    showRefundList: false,
    loading: true,
    refundLoading: false,
    refundPage: 1,
    refundTotal: 0
  },

  onLoad() {
    this.loadStats('today')
  },

  // ===== 切换时间范围 =====

  switchRange(e) {
    const range = e.currentTarget.dataset.range
    if (range !== this.data.currentRange) {
      this.setData({ currentRange: range })
      this.loadStats(range)
    }
  },

  // ===== 加载统计 =====

  loadStats(range) {
    this.setData({ loading: true })
    api.call('orders', {
      action: 'stats',
      range
    }, { showLoading: false }).then(data => {
      const summary = data.summary || {}
      // 格式化金额
      summary.paidTotalStr = (summary.paidTotal || 0).toFixed(2)
      summary.refundedTotalStr = (summary.refundedTotal || 0).toFixed(2)
      summary.netIncomeStr = (summary.netIncome || 0).toFixed(2)

      const bySchedule = (data.bySchedule || []).map(s => ({
        ...s,
        paidTotalStr: (s.paidTotal || 0).toFixed(2),
        refundedTotalStr: (s.refundedTotal || 0).toFixed(2),
        netIncomeStr: (s.netIncome || 0).toFixed(2)
      }))

      this.setData({ summary, bySchedule, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // ===== 退款订单列表 =====

  toggleRefundList() {
    if (this.data.showRefundList) {
      this.setData({ showRefundList: false })
    } else {
      this.setData({ showRefundList: true, refundPage: 1 })
      this.loadRefundList(1)
    }
  },

  loadRefundList(page) {
    this.setData({ refundLoading: true })
    api.call('orders', {
      action: 'refundList',
      page,
      pageSize: 20
    }, { showLoading: false }).then(data => {
      const STATUS_MAP = {
        pending: '待支付', paid: '已支付', cancelled: '已取消',
        completed: '已完成', refunding: '退款中', refunded: '已退款'
      }
      const list = (data.list || []).map(o => ({
        ...o,
        statusText: STATUS_MAP[o.status] || o.status,
        refundAmountStr: (o.refundAmount || 0).toFixed(2),
        totalFeeStr: (o.totalFee || 0).toFixed(2),
        refundTimeStr: o.refundAt ? new Date(o.refundAt).toLocaleString() : ''
      }))

      this.setData({
        refundList: page === 1 ? list : [...this.data.refundList, ...list],
        refundTotal: data.total || 0,
        refundPage: page,
        refundLoading: false
      })
    }).catch(() => {
      this.setData({ refundLoading: false })
    })
  },

  loadMoreRefunds() {
    if (this.data.refundList.length >= this.data.refundTotal) return
    this.loadRefundList(this.data.refundPage + 1)
  },

  // 刷新
  onPullDownRefresh() {
    this.loadStats(this.data.currentRange)
    if (this.data.showRefundList) {
      this.loadRefundList(1)
    }
    wx.stopPullDownRefresh()
  }
})
