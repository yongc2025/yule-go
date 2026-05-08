// 云函数：notify
// 功能：订阅消息授权管理 + 手动触发通知

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'saveSubscription':
      return await saveSubscription(data, openid)
    case 'getMySubscriptions':
      return await getMySubscriptions(openid)
    case 'sendTest':
      return await sendTestNotification(data, openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 保存用户订阅授权状态
// 用户在小程序端点击授权后调用
async function saveSubscription({ templateId, status }, openid) {
  try {
    // 查询是否已有记录
    const existing = await db.collection('subscriptions')
      .where({ openid, templateId })
      .get()

    if (existing.data.length > 0) {
      // 更新
      await db.collection('subscriptions').doc(existing.data[0]._id).update({
        data: {
          status: status || 'authorized',
          updatedAt: db.serverDate()
        }
      })
    } else {
      // 新增
      await db.collection('subscriptions').add({
        data: {
          openid,
          templateId,
          status: status || 'authorized',
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }

    return { code: 0, message: '已保存' }
  } catch (err) {
    return { code: -1, message: '保存失败: ' + err.message }
  }
}

// 查询我的订阅状态
async function getMySubscriptions(openid) {
  try {
    const res = await db.collection('subscriptions')
      .where({ openid })
      .get()

    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '查询失败' }
  }
}

// 测试发送通知（管理员用）
async function sendTestNotification({ templateId, touser, data: msgData }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: touser || openid,
      templateId,
      data: msgData,
      page: '/pages/orders/orders'
    })
    return { code: 0, data: result }
  } catch (err) {
    return { code: -1, message: '发送失败: ' + err.message }
  }
}

async function isAdmin(openid) {
  const res = await db.collection('admins').where({ openid }).get()
  return res.data.length > 0
}
