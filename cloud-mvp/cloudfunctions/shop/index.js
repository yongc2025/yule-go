// 云函数：shop
// 功能：门店信息管理（管理员编辑，用户查询）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'list':
      return await listShops()
    case 'detail':
      return await getShopDetail(data)
    case 'update':
      return await updateShop(data, openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 门店列表
async function listShops() {
  try {
    const res = await db.collection('merchants').limit(10).get()
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 门店详情
async function getShopDetail({ id }) {
  try {
    const res = await db.collection('merchants').doc(id).get()
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '门店不存在' }
  }
}

// 更新门店（管理员）
async function updateShop({ id, ...updates }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    // 过滤不允许修改的字段
    delete updates._id
    delete updates._openid
    delete updates.createdAt

    updates.updatedAt = db.serverDate()
    await db.collection('merchants').doc(id).update({ data: updates })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    return { code: -1, message: '更新失败: ' + err.message }
  }
}

// 检查是否是管理员
async function isAdmin(openid) {
  const res = await db.collection('admins').where({ openid }).get()
  return res.data.length > 0
}
