const api = require('../../utils/api')

Page({
  data: {
    info: {},       // 活动信息（从上一页传入）
    adults: 1,
    children: 0,
    contactName: '',
    contactPhone: '',
    remark: '',
    adultFee: 0,
    childFee: 0,
    originalFee: 0,
    companionDiscount: 0,
    companionRule: '',
    companionGift: '',
    memberDiscount: 0,
    bestDiscount: 0,
    discountType: '',
    totalFee: 0,
    submitting: false,
    subscribed: false  // 是否已授权订阅消息
  },

  onLoad(options) {
    if (options.data) {
      const info = JSON.parse(decodeURIComponent(options.data))
      this.setData({ info })
      this.calcFee()
    }
  },

  // 调整成人数
  adjustAdults(e) {
    const delta = e.currentTarget.dataset.delta
    const adults = Math.max(1, Math.min(20, this.data.adults + delta))
    this.setData({ adults })
    this.calcFee()
  },

  // 调整儿童数
  adjustChildren(e) {
    const delta = e.currentTarget.dataset.delta
    const children = Math.max(0, Math.min(10, this.data.children + delta))
    this.setData({ children })
    this.calcFee()
  },

  // 计算费用（含优惠预览）
  calcFee() {
    const { info, adults, children } = this.data
    const adultFee = (info.price || 0) * adults
    const childFee = (info.childPrice || 0) * children
    const originalFee = adultFee + childFee

    // 先用本地规则快速预览同行优惠
    const totalPeople = adults + children
    let companionDiscount = 0
    let companionRule = ''
    let companionGift = ''
    if (totalPeople >= 3) {
      companionDiscount = 15 * totalPeople
      companionRule = `${totalPeople}人同行，每人立减¥15`
      companionGift = '鱼饵礼包'
    } else if (totalPeople >= 2) {
      companionDiscount = 10 * totalPeople
      companionRule = `${totalPeople}人同行，每人立减¥10`
    }

    // 本地先算一个预估总价，异步获取精确值（含会员折扣）
    this.setData({
      adultFee,
      childFee,
      originalFee,
      companionDiscount,
      companionRule,
      companionGift,
      totalFee: Math.max(0, originalFee - companionDiscount)
    })

    // 异步获取精确优惠（含会员折扣）
    this._fetchDiscountPreview()
  },

  // 异步获取优惠预览
  _fetchDiscountPreview() {
    const { info, adults, children } = this.data
    if (!info.activityId) return

    api.call('orders', {
      action: 'calcDiscount',
      activityId: info.activityId,
      adults,
      children
    }, { showLoading: false }).then(res => {
      if (res.code === 0) {
        const d = res.data
        this.setData({
          originalFee: d.originalFee,
          companionDiscount: d.companionDiscount,
          companionRule: d.companionRule,
          companionGift: d.companionGift,
          memberDiscount: d.memberDiscount,
          bestDiscount: d.bestDiscount,
          discountType: d.discountType,
          totalFee: d.finalFee
        })
      }
    }).catch(() => {})
  },

  // 输入联系人
  onInputName(e) {
    this.setData({ contactName: e.detail.value })
  },

  onInputPhone(e) {
    this.setData({ contactPhone: e.detail.value })
  },

  onInputRemark(e) {
    this.setData({ remark: e.detail.value })
  },

  // 请求订阅消息授权
  requestSubscribe() {
    // 模板 ID 需要在微信公众平台申请后填入
    // TODO: 部署时替换为真实模板 ID
    const templateIds = [
      // 'your_template_id_1',  // 团期变更通知
      // 'your_template_id_2',  // 团期取消通知
    ]

    if (templateIds.length === 0) {
      console.log('未配置订阅消息模板，跳过授权')
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      wx.requestSubscribeMessage({
        tmplIds: templateIds,
        success: (res) => {
          // res 格式: { templateId: 'accept' | 'reject' | 'ban' }
          const accepted = Object.values(res).some(v => v === 'accept')
          if (accepted) {
            this.setData({ subscribed: true })
            // 保存授权状态到云端
            for (const [tid, status] of Object.entries(res)) {
              if (status === 'accept') {
                api.callSilent('notify', {
                  action: 'saveSubscription',
                  templateId: tid,
                  status: 'authorized'
                })
              }
            }
          }
          resolve()
        },
        fail: (err) => {
          console.warn('订阅消息授权失败:', err)
          resolve() // 不阻塞下单流程
        }
      })
    })
  },

  // 提交订单
  submitOrder() {
    // 校验
    if (!this.data.contactName.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(this.data.contactPhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (this.data.submitting) return

    this.setData({ submitting: true })

    // 先请求订阅消息授权（不阻塞）
    this.requestSubscribe().then(() => {
      return this._doCreateOrder()
    }).catch(err => {
      console.error('下单流程异常:', err)
      this.setData({ submitting: false })
      wx.showToast({ title: '下单失败，请重试', icon: 'none' })
    })
  },

  _doCreateOrder() {
    const { info, adults, children, contactName, contactPhone, remark, totalFee } = this.data

    // 调用云函数创建订单
    api.call('orders', {
      action: 'create',
      activityId: info.activityId,
      scheduleId: info.scheduleId,
      adults,
      children,
      contactName,
      contactPhone,
      remark,
      totalFee
    }).then(orderInfo => {
      if (orderInfo.mockPay) {
        // 测试模式：云函数已直接标记为已支付，跳过微信支付
        console.log('[MOCK_PAY] 模拟支付成功，订单号:', orderInfo.orderNo)
        return Promise.resolve()
      }
      // 正式模式：发起微信支付
      return this.wxPay(orderInfo)
    }).then(() => {
      wx.showToast({ title: '支付成功！', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/orders/orders' })
      }, 1500)
    }).catch(err => {
      console.error('下单失败:', err)
      this.setData({ submitting: false })
    })
  },

  // 微信支付
  wxPay(orderInfo) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        ...orderInfo.payment,
        success: resolve,
        fail: (err) => {
          // 支付取消/失败 → 回滚名额
          api.callSilent('orders', {
            action: 'cancel',
            orderId: orderInfo.orderId
          })

          if (err.errMsg.includes('cancel')) {
            wx.showToast({ title: '已取消支付', icon: 'none' })
          } else {
            wx.showToast({ title: '支付失败，请重试', icon: 'none' })
          }
          reject(err)
        }
      })
    })
  }
})
