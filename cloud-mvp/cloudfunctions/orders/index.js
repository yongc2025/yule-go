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
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 创建订单
async function createOrder({ activityId, scheduleId, adults, children, contactName, contactPhone, remark, totalFee }, openid) {
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

    // 3. 校验费用
    const expectedFee = (activity.price || 0) * adults + (activity.childPrice || 0) * children
    if (Math.abs(expectedFee - totalFee) > 0.01) {
      return { code: -1, message: '费用不一致，请刷新重试' }
    }

    // 4. 生成订单号和核销码
    const orderNo = 'YL' + Date.now() + String(Math.random()).slice(2, 6)
    const checkinCode = String(Math.floor(100000 + Math.random() * 900000))

    // 5. 创建订单
    const order = {
      orderNo,
      openid,
      activityId,
      activityName: activity.name,
      scheduleId,
      scheduleDate: schedule.date,
      adults,
      children,
      contactName,
      contactPhone,
      remark: remark || '',
      totalFee,
      checkinCode,
      status: 'pending', // pending → paid → completed / cancelled
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const orderRes = await db.collection('orders').add({ data: order })

    // 6. 扣减名额
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

// 取消订单
async function cancelOrder({ orderId }, openid) {
  try {
    const orderRes = await db.collection('orders').doc(orderId).get()
    const order = orderRes.data

    if (order.openid !== openid) {
      return { code: -1, message: '无权操作' }
    }
    if (order.status !== 'pending') {
      return { code: -1, message: '该订单无法取消' }
    }

    // 更新订单状态
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

    return { code: 0, message: '已取消' }
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

// 生成随机字符串
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
