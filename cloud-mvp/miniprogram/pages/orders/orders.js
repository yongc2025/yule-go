const api = require('../../utils/api')
const dateUtil = require('../../utils/date')

const STATUS_MAP = {
  pending: '待支付',
  paid: '已支付',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款',
  completed: '已完成'
}

Page({
  data: {
    orders: [],
    currentTab: 'all',
    loading: true
  },

  onShow() {
    this.loadOrders()
  },

  // 加载订单列表
  loadOrders() {
    this.setData({ loading: true })
    const db = wx.cloud.database()
    const _ = db.command

    let query = db.collection('orders').orderBy('createdAt', 'desc').limit(50)

    // 状态筛选
    if (this.data.currentTab !== 'all') {
      query = query.where({ status: this.data.currentTab })
    }

    query.get().then(res => {
      const orders = res.data.map(item => ({
        ...item,
        statusText: STATUS_MAP[item.status] || item.status,
        scheduleDate: item.scheduleDate ? dateUtil.formatDate(item.scheduleDate) : ''
      }))
      this.setData({ orders, loading: false })
    }).catch(err => {
      console.error('加载订单失败:', err)
      this.setData({ loading: false })
    })
  },

  // 切换状态 tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab !== this.data.currentTab) {
      this.setData({ currentTab: tab })
      this.loadOrders()
    }
  },

  // 取消订单
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          api.call('orders', {
            action: 'cancel',
            orderId: id
          }).then(() => {
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadOrders()
          })
        }
      }
    })
  },

  // 显示核销码
  showCheckinCode(e) {
    const id = e.currentTarget.dataset.id
    // TODO: 弹窗展示大号核销码 + 二维码
    wx.showToast({ title: '请出示此码给领队', icon: 'none' })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrders()
    wx.stopPullDownRefresh()
  }
})
