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
    qrOrder: null,
    qrPopupSrc: ''
  },

  onShow() {
    this.loadOrders()
  },

  // 加载订单列表（通过云函数，避免数据库权限问题）
  loadOrders() {
    this.setData({ loading: true })

    api.call('orders', {
      action: 'list',
      page: 1,
      pageSize: 50
    }).then(data => {
      let orders = (data.list || []).map(item => ({
        ...item,
        statusText: STATUS_MAP[item.status] || item.status,
        scheduleDate: item.scheduleDate ? dateUtil.formatDate(item.scheduleDate) : '',
        qrSrc: ''
      }))

      // 前端状态筛选
      if (this.data.currentTab !== 'all') {
        orders = orders.filter(o => o.status === this.data.currentTab)
      }

      this.setData({ orders, loading: false })

      // 为已支付订单生成二维码图片
      this._generateOrderQRCodes(orders)
    }).catch(err => {
      console.error('加载订单失败:', err)
      this.setData({ loading: false })
    })
  },

  // 批量生成订单列表中的二维码（使用离屏 canvas）
  _generateOrderQRCodes(orders) {
    const paidOrders = orders.filter(o => o.status === 'paid' && o.checkinCode)
    if (paidOrders.length === 0) return

    // 使用第一个已支付订单的 canvas 作为复用的离屏绘制区
    // 先逐个生成，每次用完转为图片再处理下一个
    this._generateNextQR(paidOrders, 0)
  },

  // 递归生成二维码（避免并发 canvas 冲突）
  _generateNextQR(orders, index) {
    if (index >= orders.length) return

    const order = orders[index]
    const query = wx.createSelectorQuery()
    query.select('#qr-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          // Canvas 2D 不可用，降级处理
          console.warn('Canvas 2D 不可用，跳过二维码生成')
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio || 2
        const size = 200

        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)

        // 绘制二维码
        qr.drawQRToCtx(ctx, order.checkinCode, 0, 0, 3, '#2D6A4F', '#FFFFFF', size)

        // 导出为图片
        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0,
          y: 0,
          width: size * dpr,
          height: size * dpr,
          destWidth: size * 2,
          destHeight: size * 2,
          success: (imgRes) => {
            const qrSrc = imgRes.tempFilePath
            // 更新对应订单的 qrSrc
            const ordersCopy = this.data.orders.map(o => {
              if (o._id === order._id) {
                return { ...o, qrSrc }
              }
              return o
            })
            this.setData({ orders: ordersCopy })

            // 生成下一个
            setTimeout(() => {
              this._generateNextQR(orders, index + 1)
            }, 100)
          },
          fail: (err) => {
            console.error('导出二维码图片失败:', err)
            // 继续下一个
            this._generateNextQR(orders, index + 1)
          }
        })
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

  // 取消/退款订单
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    const status = e.currentTarget.dataset.status
    const order = this.data.orders.find(o => o._id === id)

    const isRefund = status === 'paid'
    const title = isRefund ? '申请退款' : '确认取消'
    const content = isRefund
      ? `确定要取消并退款吗？\n退款金额：¥${order ? order.totalFee : ''}\n退款将原路返回微信钱包`
      : '确定要取消这个订单吗？'

    wx.showModal({
      title,
      content,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: isRefund ? '退款中...' : '取消中...' })
          api.call('orders', {
            action: 'cancel',
            orderId: id
          }).then(data => {
            wx.hideLoading()
            if (isRefund && data.refundAmount > 0) {
              wx.showModal({
                title: '✅ 退款成功',
                content: `退款金额：¥${data.refundAmount}\n退款将原路返回微信钱包`,
                showCancel: false
              })
            } else {
              wx.showToast({ title: '已取消', icon: 'success' })
            }
            this.loadOrders()
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '操作失败', icon: 'none' })
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
      qrOrder: order,
      qrPopupSrc: ''
    })

    // 延迟生成弹窗二维码
    setTimeout(() => {
      this._generatePopupQR(order.checkinCode || order.orderNo)
    }, 150)
  },

  // 生成弹窗大二维码
  _generatePopupQR(text) {
    const query = wx.createSelectorQuery()
    query.select('#qr-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.warn('Canvas 2D 不可用')
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio || 2
        const size = 360

        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)

        qr.drawQRToCtx(ctx, text, 0, 0, 6, '#2D6A4F', '#FFFFFF', size)

        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0,
          y: 0,
          width: size * dpr,
          height: size * dpr,
          destWidth: size * 2,
          destHeight: size * 2,
          success: (imgRes) => {
            this.setData({ qrPopupSrc: imgRes.tempFilePath })
          },
          fail: (err) => {
            console.error('导出弹窗二维码失败:', err)
          }
        })
      })
  },

  // 关闭弹窗
  closeQR() {
    this.setData({ showQR: false, qrOrder: null, qrPopupSrc: '' })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrders()
    wx.stopPullDownRefresh()
  }
})
