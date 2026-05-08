// pages/profile/edit.js
// 用户资料编辑页

const api = require('../../utils/api')

Page({
  data: {
    nickname: '',
    avatar: '',
    phone: '',
    bio: '',
    album: [],
    saving: false
  },

  onLoad() {
    this.loadProfile()
  },

  loadProfile() {
    wx.showLoading({ title: '加载中...' })
    api.call('users', { action: 'getProfile' }, { showLoading: false }).then(user => {
      wx.hideLoading()
      this.setData({
        nickname: user.nickname || '',
        avatar: user.avatar || '',
        phone: user.phone || '',
        bio: user.bio || '',
        album: user.album || []
      })
    }).catch(() => {
      wx.hideLoading()
      // 降级：从缓存读取
      const cached = wx.getStorageSync('userInfo') || {}
      this.setData({
        nickname: cached.nickName || '',
        avatar: cached.avatarUrl || ''
      })
    })
  },

  // ===== 头像 =====

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...' })
        this._uploadImage(filePath).then(fileID => {
          wx.hideLoading()
          this.setData({ avatar: fileID })
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '上传失败', icon: 'none' })
        })
      }
    })
  },

  // ===== 昵称 =====

  onInputNickname(e) {
    this.setData({ nickname: e.detail.value })
  },

  // ===== 简介 =====

  onInputBio(e) {
    this.setData({ bio: e.detail.value })
  },

  // ===== 手机号 =====

  getPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      return
    }
    // 调用云函数解密获取手机号
    wx.cloud.callFunction({
      name: 'users',
      data: {
        action: 'updatePhone',
        data: { cloudID: e.detail.cloudID }
      }
    }).then(res => {
      if (res.result.code === 0) {
        wx.showToast({ title: '手机号已绑定', icon: 'success' })
        this.loadProfile() // 刷新
      } else {
        wx.showToast({ title: res.result.message || '绑定失败', icon: 'none' })
      }
    }).catch(() => {
      wx.showToast({ title: '绑定失败', icon: 'none' })
    })
  },

  // 手动输入手机号
  onInputPhone(e) {
    this.setData({ phone: e.detail.value })
  },

  bindPhoneManual() {
    const phone = this.data.phone.trim()
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    api.call('users', {
      action: 'updatePhone',
      data: { phone }
    }).then(() => {
      wx.showToast({ title: '手机号已更新', icon: 'success' })
    })
  },

  // ===== 相册 =====

  addAlbumPhoto() {
    const remaining = 9 - this.data.album.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多9张照片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: Math.min(remaining, 3),
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        wx.showLoading({ title: '上传中...' })
        const uploads = res.tempFiles.map(f => this._uploadImage(f.tempFilePath))
        Promise.all(uploads).then(fileIDs => {
          // 逐个添加到云端相册
          const addNext = (idx) => {
            if (idx >= fileIDs.length) {
              wx.hideLoading()
              wx.showToast({ title: `已上传${fileIDs.length}张`, icon: 'success' })
              this.loadProfile()
              return
            }
            api.callSilent('users', {
              action: 'uploadAlbum',
              data: { fileID: fileIDs[idx] }
            }).then(() => addNext(idx + 1)).catch(() => addNext(idx + 1))
          }
          addNext(0)
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '部分上传失败', icon: 'none' })
        })
      }
    })
  },

  deleteAlbumPhoto(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除照片',
      content: '确定删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          api.call('users', {
            action: 'deleteAlbum',
            data: { index }
          }).then(() => {
            const album = [...this.data.album]
            album.splice(index, 1)
            this.setData({ album })
            wx.showToast({ title: '已删除', icon: 'success' })
          })
        }
      }
    })
  },

  previewAlbum(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.album[index],
      urls: this.data.album
    })
  },

  // ===== 保存 =====

  saveProfile() {
    if (this.data.saving) return

    const { nickname, avatar, bio } = this.data
    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    api.call('users', {
      action: 'updateProfile',
      data: {
        nickname: nickname.trim(),
        avatar,
        bio: bio.trim()
      }
    }, { showLoading: false }).then(() => {
      wx.hideLoading()
      // 同步更新本地缓存
      wx.setStorageSync('userInfo', {
        nickName: nickname.trim(),
        avatarUrl: avatar
      })
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 800)
    }).catch(() => {
      wx.hideLoading()
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  // ===== 工具 =====

  _uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      const ts = Date.now()
      const rand = Math.random().toString(36).substr(2, 8)
      const ext = filePath.split('.').pop() || 'jpg'
      wx.cloud.uploadFile({
        cloudPath: `avatars/${ts}_${rand}.${ext}`,
        filePath,
        success: res => resolve(res.fileID),
        fail: reject
      })
    })
  }
})
