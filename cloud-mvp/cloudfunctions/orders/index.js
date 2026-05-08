// 云函数：orders
// 功能：订单创建、支付、取消、查询

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'create':
      return await createOrder(event, openid)
    case 'cancel':
      return await cancelOrder(event, openid)
    case 'list':
      return await listOrders(event, openid)
    case 'detail':
      return await getOrderDetail(event, openid)
    case 'payCallback':
      return await payCallback(event)
    case 'stats':
      return await getOrderStats(event, openid)
    case 'refundList':
      return await getRefundList(event, openid)
    case 'calcDiscount':
      return await calcDiscountPreview(event, openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 同行优惠规则
const COMPANION_DISCOUNTS = [
  { minPeople: 3, discountPerPerson: 15, gift: '鱼饵礼包' },
  { minPeople: 2, discountPerPerson: 10, gift: '' }
]

// 计算同行优惠
function calcCompanionDiscount(totalPeople) {
  for (const rule of COMPANION_DISCOUNTS) {
    if (totalPeople >= rule.minPeople) {
      return {
        discountPerPerson: rule.discountPerPerson,
        totalDiscount: rule.discountPerPerson * totalPeople,
        gift: rule.gift,
        rule: `${totalPeople}人同行，每人立减¥${rule.discountPerPerson}${rule.gift ? ' + 赠' + rule.gift : ''}`
      }
    }
  }
  return { discountPerPerson: 0, totalDiscount: 0, gift: '', rule: '' }
}

// 创建订单
async function createOrder({ activityId, scheduleId, adults, children, contactName, contactPhone, remark, totalFee, couponId, useBalance }, openid) {
  try {
    // 1. 校验团期
    const scheduleRes = await db.collection('schedules').doc(scheduleId).get()
    const schedule = scheduleRes.data

    if (schedule.status !== 'active') {
      return { code: -1, message: '该团期不可报名' }
    }

    const slotsLeft = (schedule.maxSlots || 0) - (schedule.bookedSlots || 0)
    const totalPeople = adults + children
    if (slotsLeft < totalPeople) {
      return { code: -1, message: `名额不足，仅剩 ${slotsLeft} 位` }
    }

    // 2. 获取活动信息
    const activityRes = await db.collection('activities').doc(activityId).get()
    const activity = activityRes.data

    // 3. 计算原价
    const originalFee = (activity.price || 0) * adults + (activity.childPrice || 0) * children

    // 4. 计算同行优惠
    const companionDiscount = calcCompanionDiscount(totalPeople)

    // 5. 获取会员折扣（travelDiscount 是每次出行立减金额）
    let memberDiscount = 0
    const walletRes = await db.collection('user_wallets').where({ openid }).get()
    if (walletRes.data.length > 0) {
      const wallet = walletRes.data[0]
      const MEMBER_LEVELS = [
        { level: 0, travelDiscount: 0 },
        { level: 1, travelDiscount: 10 },
        { level: 2, travelDiscount: 20 },
        { level: 3, travelDiscount: 30 }
      ]
      const levelInfo = MEMBER_LEVELS.find(l => l.level === wallet.memberLevel) || MEMBER_LEVELS[0]
      memberDiscount = levelInfo.travelDiscount || 0
    }

    // 6. 同行优惠与会员折扣取最优惠（不叠加）
    const bestDiscount = Math.max(companionDiscount.totalDiscount, memberDiscount)
    const discountType = companionDiscount.totalDiscount >= memberDiscount ? 'companion' : 'member'
    const afterDiscount = Math.max(0, originalFee - bestDiscount)

    // 7. 邀请立减（被邀请人首单 ¥15）
    let inviteDiscount = 0
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length > 0 && userRes.data[0].invitedBy) {
      const orderCount = await db.collection('orders')
        .where({ openid, status: _.in(['paid', 'completed']) })
        .count()
      if (orderCount.total === 0) {
        inviteDiscount = 15
      }
    }

    // 8. 优惠券抵扣
    let couponDiscount = 0
    let usedCoupon = null
    if (couponId) {
      const couponRes = await db.collection('coupons').doc(couponId).get()
      const coupon = couponRes.data
      if (coupon.openid === openid && coupon.status === 'unused') {
        const now = new Date()
        if (!coupon.expireAt || new Date(coupon.expireAt) >= now) {
          couponDiscount = coupon.amount || 0
          usedCoupon = coupon
        }
      }
    }

    // 9. 余额抵扣
    let balanceDeduction = 0
    if (useBalance && userBalance > 0) {
      const afterCoupon = Math.max(0, afterDiscount - inviteDiscount - couponDiscount)
      balanceDeduction = Math.min(userBalance, afterCoupon)
    }

    // 10. 最终价格校验
    const expectedFee = Math.max(0, afterDiscount - inviteDiscount - couponDiscount - balanceDeduction)
    if (Math.abs(expectedFee - totalFee) > 0.01) {
      return { code: -1, message: '费用不一致，请刷新重试' }
    }

    // 11. 生成订单号和核销码
    const orderNo = 'YL' + Date.now() + String(Math.random()).slice(2, 6)
    const checkinCode = String(Math.floor(100000 + Math.random() * 900000))

    // 12. 创建订单
    const order = {
      orderNo,
      openid,
      activityId,
      activityName: activity.name,
      scheduleId,
      scheduleDate: schedule.date,
      adults,
      children,
      totalPeople,
      contactName,
      contactPhone,
      remark: remark || '',
      originalFee,
      totalFee,
      discountDetail: {
        companionDiscount: companionDiscount.totalDiscount > 0 ? {
          discountPerPerson: companionDiscount.discountPerPerson,
          totalDiscount: companionDiscount.totalDiscount,
          gift: companionDiscount.gift,
          rule: companionDiscount.rule
        } : null,
        memberDiscount,
        inviteDiscount,
        couponDiscount,
        couponId: usedCoupon ? usedCoupon._id : '',
        couponType: usedCoupon ? usedCoupon.type : '',
        balanceDeduction,
        bestDiscount,
        discountType
      },
      checkinCode,
      status: 'pending', // pending → paid → completed / cancelled
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const orderRes = await db.collection('orders').add({ data: order })

    // 13. 使用优惠券
    if (usedCoupon) {
      await db.collection('coupons').doc(usedCoupon._id).update({
        data: { status: 'used', orderId: orderRes._id, usedAt: db.serverDate() }
      })
    }

    // 14. 扣减余额
    if (balanceDeduction > 0) {
      await db.collection('user_wallets').where({ openid }).update({
        data: { balance: _.inc(-balanceDeduction), updatedAt: db.serverDate() }
      })
      await db.collection('wallet_logs').add({
        data: {
          openid,
          type: 'order_pay',
          amount: -balanceDeduction,
          description: `订单抵扣（${orderNo}）`,
          orderId: orderRes._id,
          createdAt: db.serverDate()
        }
      })
    }

    // 15. 扣减名额
    await db.collection('schedules').doc(scheduleId).update({
      data: {
        bookedSlots: _.inc(totalPeople),
        updatedAt: db.serverDate()
      }
    })

    // 7. 调用微信支付统一下单
    // ⚠️ 测试阶段：如未配置商户号，自动降级为模拟支付
    const USE_MOCK_PAY = !process.env.SUB_MCH_ID // 未配置环境变量时启用模拟

    let payment = null
    if (USE_MOCK_PAY) {
      // 模拟支付：直接标记订单为已支付，返回模拟 payment 参数
      console.log('[MOCK_PAY] 测试模式，跳过真实支付，订单号:', orderNo)
      await db.collection('orders').doc(orderRes._id).update({
        data: {
          status: 'paid',
          paidAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
      // 返回空 payment，前端会直接调用 wx.requestPayment（开发工具自动模拟）
      payment = {
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: generateNonceStr(),
        package: 'prepay_id=mock_' + orderNo,
        signType: 'MD5',
        paySign: 'MOCK_SIGN'
      }
    } else {
      const payRes = await cloud.cloudPay.unifiedOrder({
        body: `渔乐出行-${activity.name}`,
        outTradeNo: orderNo,
        spbillCreateIp: '127.0.0.1',
        subMchId: process.env.SUB_MCH_ID,
        totalFee: Math.round(totalFee * 100), // 单位：分
        envId: cloud.DYNAMIC_CURRENT_ENV,
        functionName: 'orders', // 支付回调云函数
        nonceStr: generateNonceStr(),
        tradeType: 'JSAPI'
      })
      payment = payRes.payment
    }

    return {
      code: 0,
      data: {
        orderId: orderRes._id,
        orderNo,
        payment, // 前端用这个参数调用 wx.requestPayment
        mockPay: USE_MOCK_PAY // 告知前端是否为模拟支付
      }
    }
  } catch (err) {
    console.error('创建订单失败:', err)
    return { code: -1, message: '下单失败: ' + err.message }
  }
}

// 支付回调
async function payCallback(event) {
  const { outTradeNo, resultCode } = event

  if (resultCode !== 'SUCCESS') {
    return { errcode: 0, errmsg: 'OK' }
  }

  try {
    // 更新订单状态
    await db.collection('orders').where({ orderNo: outTradeNo }).update({
      data: {
        status: 'paid',
        paidAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    // 发放邀请奖励（被邀请人首单支付成功后）
    const paidOrderRes = await db.collection('orders').where({ orderNo: outTradeNo }).get()
    if (paidOrderRes.data.length > 0) {
      const paidOrder = paidOrderRes.data[0]
      try {
        const referralRes = await db.collection('referrals')
          .where({ inviteeOpenid: paidOrder.openid, status: 'pending' })
          .get()
        if (referralRes.data.length > 0) {
          // 更新 referral 记录
          await db.collection('referrals').doc(referralRes.data[0]._id).update({
            data: { status: 'completed', orderId: paidOrder._id, updatedAt: db.serverDate() }
          })
          // 邀请人余额增加 ¥20
          const inviterOpenid = referralRes.data[0].inviterOpenid
          await db.collection('users').where({ openid: inviterOpenid }).update({
            data: { balance: _.inc(20), updatedAt: db.serverDate() }
          })
          await db.collection('wallet_logs').add({
            data: {
              openid: inviterOpenid,
              type: 'invite_reward',
              amount: 20,
              description: `邀请好友奖励（${paidOrder.openid}首单成功）`,
              orderId: paidOrder._id,
              createdAt: db.serverDate()
            }
          })
        }
      } catch (rewardErr) {
        console.error('邀请奖励发放失败（不影响支付回调）:', rewardErr)
      }
    }

    // 记录用户门店关系（去过的店）
    const orderRes = await db.collection('orders').where({ orderNo: outTradeNo }).get()
    if (orderRes.data.length > 0) {
      const order = orderRes.data[0]
      if (order.activityId) {
        const activityRes = await db.collection('activities').doc(order.activityId).get()
        const activity = activityRes.data
        if (activity.merchantId) {
          // upsert 用户门店关系
          const shopRes = await db.collection('user_shops').where({
            openid: order.openid,
            merchantId: activity.merchantId
          }).get()

          if (shopRes.data.length > 0) {
            await db.collection('user_shops').doc(shopRes.data[0]._id).update({
              data: {
                visitCount: _.inc(1),
                lastVisit: db.serverDate(),
                updatedAt: db.serverDate()
              }
            })
          } else {
            await db.collection('user_shops').add({
              data: {
                openid: order.openid,
                merchantId: activity.merchantId,
                isPrimary: false,
                visitCount: 1,
                lastVisit: db.serverDate(),
                createdAt: db.serverDate(),
                updatedAt: db.serverDate()
              }
            })
          }
        }
      }
    }

    return { errcode: 0, errmsg: 'OK' }
  } catch (err) {
    console.error('支付回调处理失败:', err)
    return { errcode: 0, errmsg: 'OK' }
  }
}

// 取消订单（支持 pending 和 paid 状态）
async function cancelOrder({ orderId }, openid) {
  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    const order = orderRes.data

    if (order.openid !== openid) {
      return { code: -1, message: '无权操作' }
    }

    // pending 状态：直接取消，无需退款
    if (order.status === 'pending') {
      await db.collection('orders').doc(orderId).update({
        data: {
          status: 'cancelled',
          cancelledAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })

      // 退还名额
      const totalPeople = (order.adults || 0) + (order.children || 0)
      await db.collection('schedules').doc(order.scheduleId).update({
        data: {
          bookedSlots: _.inc(-totalPeople),
          updatedAt: db.serverDate()
        }
      })

      return { code: 0, message: '已取消', data: { refundAmount: 0 } }
    }

    // paid 状态：需要退款
    if (order.status === 'paid') {
      // MVP 简化：全额退款
      const refundAmount = order.totalFee || 0
      const refundNo = 'RF' + Date.now() + String(Math.random()).slice(2, 6)

      // 检查是否模拟支付
      const isMockPay = !order.paymentParams || (order.paymentParams.package && order.paymentParams.package.includes('mock'))

      let refundResult = null
      if (!isMockPay && order.paymentParams && order.paymentParams.transactionId) {
        // 真实支付：调用微信支付退款
        try {
          refundResult = await cloud.cloudPay.refund({
            subMchId: process.env.SUB_MCH_ID,
            transactionId: order.paymentParams.transactionId,
            outTradeNo: order.orderNo,
            outRefundNo: refundNo,
            totalFee: Math.round(refundAmount * 100),
            refundFee: Math.round(refundAmount * 100)
          })
        } catch (refundErr) {
          console.error('微信退款接口调用失败:', refundErr)
          // 降级为模拟退款
          refundResult = { resultCode: 'MOCK_REFUND' }
        }
      } else {
        // 模拟支付：直接标记退款成功
        refundResult = { resultCode: 'MOCK_REFUND' }
      }

      // 更新订单状态
      await db.collection('orders').doc(orderId).update({
        data: {
          status: 'refunded',
          refundNo,
          refundAmount,
          refundAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })

      // 退还名额
      const totalPeople = (order.adults || 0) + (order.children || 0)
      await db.collection('schedules').doc(order.scheduleId).update({
        data: {
          bookedSlots: _.inc(-totalPeople),
          updatedAt: db.serverDate()
        }
      })

      return {
        code: 0,
        message: '退款成功',
        data: {
          refundAmount,
          refundNo
        }
      }
    }

    return { code: -1, message: '该订单无法取消' }
  } catch (err) {
    return { code: -1, message: '取消失败: ' + err.message }
  }
}

// 用户订单列表
async function listOrders({ page = 1, pageSize = 20 }, openid) {
  try {
    const countRes = await db.collection('orders').where({ openid }).count()
    const dataRes = await db.collection('orders')
      .where({ openid })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: dataRes.data,
        total: countRes.total,
        page,
        pageSize
      }
    }
  } catch (err) {
    return { code: -1, message: '查询失败' }
  }
}

// 订单详情
async function getOrderDetail({ orderId }, openid) {
  try {
    const res = await db.collection('orders').doc(orderId).get()
    if (res.data.openid !== openid) {
      return { code: -1, message: '无权查看' }
    }
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '订单不存在' }
  }
}

// 订单统计（按日/按团期）
async function getOrderStats({ range, scheduleId }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    const now = new Date()
    let startDate, endDate

    if (range === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1)
      weekStart.setHours(0, 0, 0, 0)
      startDate = weekStart
      endDate = now
    } else if (range === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate = monthStart
      endDate = now
    } else {
      // 默认今日
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      startDate = todayStart
      endDate = now
    }

    // 查询时间范围内的所有订单
    // createdAt 存的是 db.serverDate()，用 Date 对象查询
    let query = {
      createdAt: _.gte(startDate).and(_.lte(endDate))
    }
    if (scheduleId) {
      query.scheduleId = scheduleId
    }

    const ordersRes = await db.collection('orders')
      .where(query)
      .limit(1000)
      .get()

    const orders = ordersRes.data

    // 统计
    let paidCount = 0, paidTotal = 0
    let refundedCount = 0, refundedTotal = 0
    let cancelledCount = 0
    let pendingCount = 0

    const bySchedule = {}

    for (const order of orders) {
      const fee = order.totalFee || 0
      const sid = order.scheduleId || 'unknown'

      if (!bySchedule[sid]) {
        bySchedule[sid] = {
          scheduleId: sid,
          activityName: order.activityName || '',
          scheduleDate: order.scheduleDate || '',
          paidCount: 0, paidTotal: 0,
          refundedCount: 0, refundedTotal: 0,
          netIncome: 0
        }
      }

      switch (order.status) {
        case 'paid':
        case 'completed':
          paidCount++
          paidTotal += fee
          bySchedule[sid].paidCount++
          bySchedule[sid].paidTotal += fee
          break
        case 'refunded':
          refundedCount++
          refundedTotal += (order.refundAmount || fee)
          bySchedule[sid].refundedCount++
          bySchedule[sid].refundedTotal += (order.refundAmount || fee)
          break
        case 'cancelled':
          cancelledCount++
          break
        case 'pending':
          pendingCount++
          break
      }
    }

    // 计算每个团期的净收入
    for (const sid of Object.keys(bySchedule)) {
      const s = bySchedule[sid]
      s.netIncome = s.paidTotal - s.refundedTotal
    }

    return {
      code: 0,
      data: {
        summary: {
          totalOrders: orders.length,
          paidCount,
          paidTotal: Math.round(paidTotal * 100) / 100,
          refundedCount,
          refundedTotal: Math.round(refundedTotal * 100) / 100,
          netIncome: Math.round((paidTotal - refundedTotal) * 100) / 100,
          cancelledCount,
          pendingCount
        },
        bySchedule: Object.values(bySchedule).sort((a, b) =>
          (b.scheduleDate || '').localeCompare(a.scheduleDate || '')
        ),
        range,
        startDate,
        endDate
      }
    }
  } catch (err) {
    return { code: -1, message: '统计失败: ' + err.message }
  }
}

// 退款订单列表
async function getRefundList({ page = 1, pageSize = 20 }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    const countRes = await db.collection('orders')
      .where({ status: 'refunded' })
      .count()

    const dataRes = await db.collection('orders')
      .where({ status: 'refunded' })
      .orderBy('refundAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: dataRes.data,
        total: countRes.total,
        page,
        pageSize
      }
    }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 检查是否是管理员
async function isAdmin(openid) {
  const res = await db.collection('admins').where({ openid }).get()
  return res.data.length > 0
}

// 预览优惠（下单前实时计算，含券/余额/邀请立减）
async function calcDiscountPreview({ activityId, adults, children, couponId, useBalance }, openid) {
  try {
    const totalPeople = adults + children

    // 活动价格
    const activityRes = await db.collection('activities').doc(activityId).get()
    const activity = activityRes.data
    const originalFee = (activity.price || 0) * adults + (activity.childPrice || 0) * children

    // 同行优惠
    const companionDiscount = calcCompanionDiscount(totalPeople)

    // 会员折扣
    let memberDiscount = 0
    let memberLevel = 0
    const walletRes = await db.collection('user_wallets').where({ openid }).get()
    let userBalance = 0
    if (walletRes.data.length > 0) {
      const wallet = walletRes.data[0]
      memberLevel = wallet.memberLevel || 0
      userBalance = wallet.balance || 0
      const MEMBER_LEVELS = [
        { level: 0, travelDiscount: 0 },
        { level: 1, travelDiscount: 10 },
        { level: 2, travelDiscount: 20 },
        { level: 3, travelDiscount: 30 }
      ]
      const levelInfo = MEMBER_LEVELS.find(l => l.level === memberLevel) || MEMBER_LEVELS[0]
      memberDiscount = levelInfo.travelDiscount || 0
    }

    // 同行优惠与会员折扣取最优惠
    const bestDiscount = Math.max(companionDiscount.totalDiscount, memberDiscount)
    const discountType = companionDiscount.totalDiscount >= memberDiscount ? 'companion' : 'member'
    const afterDiscount = Math.max(0, originalFee - bestDiscount)

    // 邀请立减（被邀请人首单 ¥15）
    let inviteDiscount = 0
    let isFirstOrder = false
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length > 0 && userRes.data[0].invitedBy) {
      // 查询是否为首单
      const orderCount = await db.collection('orders')
        .where({ openid, status: _.in(['paid', 'completed']) })
        .count()
      if (orderCount.total === 0) {
        inviteDiscount = 15
        isFirstOrder = true
      }
    }

    // 优惠券
    let couponDiscount = 0
    let couponInfo = null
    if (couponId) {
      const couponRes = await db.collection('coupons').doc(couponId).get()
      const coupon = couponRes.data
      if (coupon.openid === openid && coupon.status === 'unused') {
        const now = new Date()
        if (!coupon.expireAt || new Date(coupon.expireAt) >= now) {
          couponDiscount = coupon.amount || 0
          couponInfo = {
            _id: coupon._id,
            type: coupon.type,
            amount: coupon.amount,
            typeName: coupon.typeName || coupon.type
          }
        }
      }
    }

    // 可用优惠券列表
    const now = new Date()
    const couponsRes = await db.collection('coupons')
      .where({ openid, status: 'unused', expireAt: _.gte(now) })
      .get()
    const availableCoupons = couponsRes.data
      .filter(c => c.type !== 'equipment')
      .map(c => ({
        _id: c._id,
        type: c.type,
        amount: c.amount || 0,
        typeName: (c.typeName) || c.type,
        description: c.description || '',
        expireAt: c.expireAt
      }))

    // 余额抵扣
    let balanceDeduction = 0
    if (useBalance && userBalance > 0) {
      const afterCoupon = Math.max(0, afterDiscount - inviteDiscount - couponDiscount)
      balanceDeduction = Math.min(userBalance, afterCoupon)
    }

    // 最终价格
    const finalFee = Math.max(0, afterDiscount - inviteDiscount - couponDiscount - balanceDeduction)

    return {
      code: 0,
      data: {
        originalFee,
        companionDiscount: companionDiscount.totalDiscount,
        companionRule: companionDiscount.rule,
        companionGift: companionDiscount.gift,
        memberDiscount,
        memberLevel,
        bestDiscount,
        discountType,
        inviteDiscount,
        isFirstOrder,
        couponDiscount,
        couponInfo,
        availableCoupons,
        userBalance,
        balanceDeduction,
        finalFee
      }
    }
  } catch (err) {
    return { code: -1, message: '计算失败: ' + err.message }
  }
}

// 生成随机字符串
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
