const api = require('../../utils/api')
const dateUtil = require('../../utils/date')
const qr = require('../../utils/qrcode')

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
    loading: true,
    showQR: false,
    qrOrder: null
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

      // 为已支付订单绘制二维码
      orders.forEach(order => {
        if (order.status === 'paid' && order.checkinCode) {
          setTimeout(() => {
            const ctx = wx.createCanvasContext('qr-' + order._id, this)
            qr.drawQR(ctx, order.checkinCode, 0, 0, 3, '#2D6A4F', '#FFFFFF')
            ctx.draw()
          }, 200)
        }
      })
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

  // 显示核销码弹窗
  showCheckinCode(e) {
    const id = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o._id === id)
    if (!order) return

    this.setData({
      showQR: true,
      qrOrder: order
    })

    // 延迟绘制二维码
    setTimeout(() => {
      const ctx = wx.createCanvasContext('qrcode-popup', this)
      qr.drawQR(ctx, order.checkinCode || order.orderNo, 0, 0, 6, '#2D6A4F', '#FFFFFF')
      ctx.draw()
    }, 100)
  },

  // 关闭弹窗
  closeQR() {
    this.setData({ showQR: false, qrOrder: null })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrders()
    wx.stopPullDownRefresh()
  }
})
