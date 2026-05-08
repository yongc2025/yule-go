// pages/admin/shop-edit.js
// 店铺设置 — 编辑门店信息

const PRESET_TAGS = [
  '专业钓鱼指导', '亲子友好', '新手友好', '车接车送',
  '装备齐全', '10年老店', '高评分', '性价比高',
  '露营体验', '野钓专线', '老年友好', '团体定制'
]

Page({
  data: {
    shopId: '',
    form: {
      name: '',
      slogan: '',
      coverImage: '',
      address: '',
      phone: '',
      businessHours: '',
      ownerName: '',
      ownerAvatar: '',
      ownerTitle: '',
      tags: [],
      images: []
    },
    presetTags: [],
    customTag: '',
    saving: false
  },

  onLoad() {
    this.refreshPresetTags([])
    this.loadShop()
  },

  loadShop() {
    wx.showLoading({ title: '加载中...' })
    const db = wx.cloud.database()

    // MVP 单店，直接取第一条
    db.collection('merchants').limit(1).get().then(res => {
      wx.hideLoading()
      if (res.data.length === 0) {
        wx.showToast({ title: '请先创建门店', icon: 'none' })
        return
      }

      const shop = res.data[0]
      const form = {
        name: shop.name || '',
        slogan: shop.slogan || '',
        coverImage: shop.coverImage || '',
        address: shop.address || '',
        phone: shop.phone || '',
        businessHours: shop.businessHours || '',
        ownerName: shop.ownerName || '',
        ownerAvatar: shop.ownerAvatar || '',
        ownerTitle: shop.ownerTitle || '',
        tags: shop.tags || [],
        images: shop.images || []
      }

      this.setData({ shopId: shop._id, form })
      this.refreshPresetTags(form.tags)
    }).catch(err => {
      wx.hideLoading()
      console.error('加载门店失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // ===== 基本信息 =====

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  // ===== 封面图 =====

  uploadCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        this._uploadImage(filePath).then(fileID => {
          this.setData({ 'form.coverImage': fileID })
        })
      }
    })
  },

  previewCover() {
    if (this.data.form.coverImage) {
      wx.previewImage({ urls: [this.data.form.coverImage] })
    }
  },

  // ===== 老板头像 =====

  uploadAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        this._uploadImage(filePath).then(fileID => {
          this.setData({ 'form.ownerAvatar': fileID })
        })
      }
    })
  },

  // ===== 特色标签 =====

  refreshPresetTags(tags) {
    const presetTags = PRESET_TAGS.map(name => ({
      name,
      added: tags.includes(name)
    }))
    this.setData({ presetTags })
  },

  addPresetTag(e) {
    const idx = e.currentTarget.dataset.index
    const tag = this.data.presetTags[idx]
    if (tag.added) return

    const tags = [...this.data.form.tags, tag.name]
    this.setData({ 'form.tags': tags })
    this.refreshPresetTags(tags)
  },

  removeTag(e) {
    const idx = e.currentTarget.dataset.index
    const tags = [...this.data.form.tags]
    tags.splice(idx, 1)
    this.setData({ 'form.tags': tags })
    this.refreshPresetTags(tags)
  },

  onInputCustomTag(e) {
    this.setData({ customTag: e.detail.value })
  },

  addCustomTag() {
    const text = this.data.customTag.trim()
    if (!text) return
    if (this.data.form.tags.includes(text)) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      return
    }
    const tags = [...this.data.form.tags, text]
    this.setData({ 'form.tags': tags, customTag: '' })
    this.refreshPresetTags(tags)
  },

  // ===== 店铺相册 =====

  chooseImage() {
    const remaining = 9 - this.data.form.images.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        wx.showLoading({ title: '上传中...' })
        const tasks = res.tempFiles.map(f => this._uploadImage(f.tempFilePath))
        Promise.all(tasks).then(fileIDs => {
          wx.hideLoading()
          const images = [...this.data.form.images, ...fileIDs]
          this.setData({ 'form.images': images })
          wx.showToast({ title: `已上传${fileIDs.length}张`, icon: 'success' })
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '部分上传失败', icon: 'none' })
        })
      }
    })
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.form.images[index],
      urls: this.data.form.images
    })
  },

  deleteImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = [...this.data.form.images]
    images.splice(idx, 1)
    this.setData({ 'form.images': images })
  },

  // ===== 保存 =====

  saveShop() {
    if (this.data.saving || !this.data.shopId) return
    const { form, shopId } = this.data

    if (!form.name.trim()) {
      wx.showToast({ title: '请输入店铺名称', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    const data = {
      name: form.name.trim(),
      slogan: form.slogan.trim(),
      coverImage: form.coverImage,
      address: form.address.trim(),
      phone: form.phone.trim(),
      businessHours: form.businessHours.trim(),
      ownerName: form.ownerName.trim(),
      ownerAvatar: form.ownerAvatar,
      ownerTitle: form.ownerTitle.trim(),
      tags: form.tags,
      images: form.images
    }

    wx.cloud.callFunction({
      name: 'shop',
      data: { action: 'update', data: { id: shopId, ...data } }
    }).then(res => {
      wx.hideLoading()
      if (res.result.code === 0) {
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 800)
      } else {
        this.setData({ saving: false })
        wx.showToast({ title: res.result.message || '保存失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      this.setData({ saving: false })
      console.error('保存失败:', err)
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
        cloudPath: `merchants/${ts}_${rand}.${ext}`,
        filePath,
        success: res => resolve(res.fileID),
        fail: err => reject(err)
      })
    })
  }
})
