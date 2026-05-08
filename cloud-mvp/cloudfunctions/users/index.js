// 云函数：users
// 功能：用户信息管理（查询/更新资料/绑定手机号/相册管理）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'getProfile':
      return await getProfile(openid)
    case 'updateProfile':
      return await updateProfile(data, openid)
    case 'updatePhone':
      return await updatePhone(data, openid)
    case 'uploadAlbum':
      return await uploadAlbum(data, openid)
    case 'deleteAlbum':
      return await deleteAlbum(data, openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 获取用户完整信息
async function getProfile(openid) {
  try {
    const res = await db.collection('users').where({ openid }).get()
    if (res.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const user = res.data[0]
    return {
      code: 0,
      data: {
        _id: user._id,
        nickname: user.nickname || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        bio: user.bio || '',
        album: user.album || [],
        balance: user.balance || 0,
        memberLevel: user.memberLevel || 0,
        isGuide: user.isGuide || false
      }
    }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 更新用户资料（昵称/头像/简介）
async function updateProfile({ nickname, avatar, bio }, openid) {
  try {
    const updates = { updatedAt: db.serverDate() }
    if (nickname !== undefined) updates.nickname = nickname
    if (avatar !== undefined) updates.avatar = avatar
    if (bio !== undefined) updates.bio = bio

    await db.collection('users').where({ openid }).update({ data: updates })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    return { code: -1, message: '更新失败: ' + err.message }
  }
}

// 绑定/更新手机号
async function updatePhone({ phone }, openid) {
  try {
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return { code: -1, message: '手机号格式不正确' }
    }

    await db.collection('users').where({ openid }).update({
      data: { phone, updatedAt: db.serverDate() }
    })
    return { code: 0, message: '手机号已更新' }
  } catch (err) {
    return { code: -1, message: '更新失败: ' + err.message }
  }
}

// 添加相册照片
async function uploadAlbum({ fileID }, openid) {
  try {
    if (!fileID) {
      return { code: -1, message: '缺少文件ID' }
    }

    // 查询当前相册数量
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }

    const album = userRes.data[0].album || []
    if (album.length >= 9) {
      return { code: -1, message: '相册最多9张照片' }
    }

    await db.collection('users').where({ openid }).update({
      data: {
        album: _.push(fileID),
        updatedAt: db.serverDate()
      }
    })
    return { code: 0, message: '上传成功' }
  } catch (err) {
    return { code: -1, message: '上传失败: ' + err.message }
  }
}

// 删除相册照片
async function deleteAlbum({ index }, openid) {
  try {
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }

    const album = [...(userRes.data[0].album || [])]
    if (index < 0 || index >= album.length) {
      return { code: -1, message: '索引无效' }
    }

    album.splice(index, 1)
    await db.collection('users').where({ openid }).update({
      data: { album, updatedAt: db.serverDate() }
    })
    return { code: 0, message: '删除成功' }
  } catch (err) {
    return { code: -1, message: '删除失败: ' + err.message }
  }
}
