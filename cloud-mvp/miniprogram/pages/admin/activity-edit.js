// pages/admin/activity-edit.js
// 活动编辑页 — 创建/编辑完整活动信息

const TYPE_OPTIONS = [
  { value: 'fishing', label: '🎣 钓鱼' },
  { value: 'camping', label: '⛺ 露营' },
  { value: 'family', label: '👨‍👩‍👧 亲子' },
  { value: 'senior', label: '👴 慢游' },
  { value: 'wild_fishing', label: '🎣 野钓' }
]

const PRESET_HIGHLIGHTS = [
  '含午餐', '车接车送', '新手友好', '亲子推荐', '野钓', '装备提供',
  '含露营装备', '含农家午餐', '全程陪同', '接送上门', '专属钓点', '进阶体验'
]

Page({
  data: {
    editId: '',
    form: {
      name: '',
      type: 'fishing',
      price: '',
      childPrice: '',
      maxSlots: '20',
      images: [],
      highlights: [],
      itinerary: [],
      includes: [],
      excludes: [],
      notes: '',
      merchantId: ''
    },
    typeOptions: TYPE_OPTIONS,
    typeIndex: 0,
    presetHighlights: [],
    customHighlight: '',
    merchants: [],
    merchantIndex: 0,
    selectedMerchant: {},
    showMerchant: false,
    merchantForm: { name: '', address: '', phone: '', slogan: '' },
    saving: false
  },

  onLoad(options) {
    // 初始化预设标签状态
    this.refreshPresetTags([])
    // 加载门店列表
    this.loadMerchants()

    if (options.id) {
      this.setData({ editId: options.id })
      wx.setNavigationBarTitle({ title: '编辑活动' })
      this.loadActivity(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新建活动' })
    }
  },

  // 加载已有活动数据
  loadActivity(id) {
    wx.showLoading({ title: '加载中...' })
    const db = wx.cloud.database()

    db.collection('activities').doc(id).get().then(res => {
      const a = res.data
      const typeIndex = TYPE_OPTIONS.findIndex(t => t.value === a.type)

      const form = {
        name: a.name || '',
        type: a.type || 'fishing',
        price: String(a.price || ''),
        childPrice: String(a.childPrice || ''),
        maxSlots: String(a.maxSlots || 20),
        images: a.images || [],
        highlights: a.highlights || [],
        itinerary: a.itinerary || [],
        includes: a.includes || [],
        excludes: a.excludes || [],
        notes: a.notes || '',
        merchantId: a.merchantId || ''
      }

      // 如果有 coverImage 且 images 为空，迁移旧数据
      if (a.coverImage && (!a.images || a.images.length === 0)) {
        form.images = [a.coverImage]
      }

      this.setData({
        form,
        typeIndex: typeIndex >= 0 ? typeIndex : 0
      })
      this.refreshPresetTags(form.highlights)
      // 设置门店选中状态
      this.matchMerchant(form.merchantId)
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      console.error('加载活动失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  },

  // ===== 门店/集合地点 =====

  loadMerchants(selectId) {
    const db = wx.cloud.database()
    db.collection('merchants').limit(10).get().then(res => {
      const merchants = res.data || []
      this.setData({ merchants })
      if (merchants.length === 0) return

      // 编辑模式：匹配已有 merchantId
      // 新建模式或指定 selectId：自动选中
      const targetId = selectId || this.data.form.merchantId
      if (targetId) {
        this.matchMerchant(targetId)
      } else if (!this.data.editId) {
        // 新建且无 merchantId → 选第一个
        this.setData({
          merchantIndex: 0,
          selectedMerchant: merchants[0],
          'form.merchantId': merchants[0]._id
        })
      }
    }).catch(err => {
      console.error('加载门店失败:', err)
    })
  },

  matchMerchant(merchantId) {
    if (!merchantId || this.data.merchants.length === 0) return
    const idx = this.data.merchants.findIndex(m => m._id === merchantId)
    if (idx >= 0) {
      this.setData({
        merchantIndex: idx,
        selectedMerchant: this.data.merchants[idx]
      })
    }
  },

  onMerchantChange(e) {
    const idx = e.detail.value
    this.setData({
      merchantIndex: idx,
      selectedMerchant: this.data.merchants[idx],
      'form.merchantId': this.data.merchants[idx]._id
    })
  },

  // ===== 基本信息 =====

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onTypeChange(e) {
    const idx = e.detail.value
    this.setData({
      typeIndex: idx,
      'form.type': TYPE_OPTIONS[idx].value
    })
  },

  // ===== 图片上传 =====

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
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles
        wx.showLoading({ title: '上传中...' })

        const uploadTasks = tempFiles.map(file => this.uploadToCloud(file.tempFilePath))
        Promise.all(uploadTasks).then(fileIDs => {
          wx.hideLoading()
          const images = [...this.data.form.images, ...fileIDs]
          this.setData({ 'form.images': images })
          wx.showToast({ title: `已上传${fileIDs.length}张`, icon: 'success' })
        }).catch(err => {
          wx.hideLoading()
          console.error('上传失败:', err)
          wx.showToast({ title: '部分上传失败', icon: 'none' })
        })
      }
    })
  },

  uploadToCloud(filePath) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 8)
      const ext = filePath.split('.').pop() || 'jpg'
      const cloudPath = `activities/${timestamp}_${random}.${ext}`

      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => resolve(res.fileID),
        fail: err => reject(err)
      })
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
    const index = e.currentTarget.dataset.index
    const images = [...this.data.form.images]
    images.splice(index, 1)
    this.setData({ 'form.images': images })
  },

  // ===== 亮点标签 =====

  refreshPresetTags(highlights) {
    const presetHighlights = PRESET_HIGHLIGHTS.map(name => ({
      name,
      added: highlights.includes(name)
    }))
    this.setData({ presetHighlights })
  },

  addPresetHighlight(e) {
    const idx = e.currentTarget.dataset.index
    const tag = this.data.presetHighlights[idx]
    if (tag.added) return // 已添加

    const highlights = [...this.data.form.highlights, tag.name]
    this.setData({ 'form.highlights': highlights })
    this.refreshPresetTags(highlights)
  },

  removeHighlight(e) {
    const idx = e.currentTarget.dataset.index
    const highlights = [...this.data.form.highlights]
    highlights.splice(idx, 1)
    this.setData({ 'form.highlights': highlights })
    this.refreshPresetTags(highlights)
  },

  onInputCustomHighlight(e) {
    this.setData({ customHighlight: e.detail.value })
  },

  addCustomHighlight() {
    const text = this.data.customHighlight.trim()
    if (!text) return
    if (this.data.form.highlights.includes(text)) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      return
    }

    const highlights = [...this.data.form.highlights, text]
    this.setData({
      'form.highlights': highlights,
      customHighlight: ''
    })
    this.refreshPresetTags(highlights)
  },

  // ===== 行程安排 =====

  addItinerary() {
    const itinerary = [...this.data.form.itinerary, { time: '', desc: '' }]
    this.setData({ 'form.itinerary': itinerary })
  },

  deleteItinerary(e) {
    const idx = e.currentTarget.dataset.index
    const itinerary = [...this.data.form.itinerary]
    itinerary.splice(idx, 1)
    this.setData({ 'form.itinerary': itinerary })
  },

  onItineraryTime(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ [`form.itinerary[${idx}].time`]: e.detail.value })
  },

  onItineraryDesc(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ [`form.itinerary[${idx}].desc`]: e.detail.value })
  },

  // ===== 费用包含 =====

  addInclude() {
    const includes = [...this.data.form.includes, '']
    this.setData({ 'form.includes': includes })
  },

  deleteInclude(e) {
    const idx = e.currentTarget.dataset.index
    const includes = [...this.data.form.includes]
    includes.splice(idx, 1)
    this.setData({ 'form.includes': includes })
  },

  onIncludeInput(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ [`form.includes[${idx}]`]: e.detail.value })
  },

  // ===== 费用不含 =====

  addExclude() {
    const excludes = [...this.data.form.excludes, '']
    this.setData({ 'form.excludes': excludes })
  },

  deleteExclude(e) {
    const idx = e.currentTarget.dataset.index
    const excludes = [...this.data.form.excludes]
    excludes.splice(idx, 1)
    this.setData({ 'form.excludes': excludes })
  },

  onExcludeInput(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ [`form.excludes[${idx}]`]: e.detail.value })
  },

  // ===== 保存 =====

  saveActivity() {
    if (this.data.saving) return
    const { form, editId } = this.data

    // 校验
    if (!form.name.trim()) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' })
      return
    }
    if (!form.price || isNaN(parseFloat(form.price))) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    // 保底：如果没选门店，自动用第一个
    let merchantId = form.merchantId || ''
    if (!merchantId && this.data.merchants.length > 0) {
      merchantId = this.data.merchants[0]._id
    }

    // 构建保存数据（过滤空值）
    const data = {
      name: form.name.trim(),
      type: form.type,
      price: parseFloat(form.price),
      childPrice: parseFloat(form.childPrice) || 0,
      maxSlots: parseInt(form.maxSlots) || 20,
      images: form.images.filter(img => img),
      coverImage: form.images.length > 0 ? form.images[0] : '',
      highlights: form.highlights.filter(h => h),
      itinerary: form.itinerary.filter(item => item.time || item.desc),
      includes: form.includes.filter(item => item.trim()),
      excludes: form.excludes.filter(item => item.trim()),
      notes: form.notes,
      merchantId: merchantId
    }

    console.log('[activity-edit] 保存数据:', JSON.stringify(data, null, 2))

    // 统一走云函数（确保权限校验 + 数据完整性）
    const action = editId ? 'update' : 'create'
    const callData = editId ? { id: editId, ...data } : data

    wx.cloud.callFunction({
      name: 'activities',
      data: { action, data: callData }
    }).then(res => {
      wx.hideLoading()
      console.log('[activity-edit] 云函数返回:', res.result)
      if (res.result.code === 0) {
        wx.showToast({ title: editId ? '已更新' : '已创建', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 800)
      } else {
        this.setData({ saving: false })
        wx.showToast({ title: res.result.message || '保存失败', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      this.setData({ saving: false })
      console.error('[activity-edit] 保存失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  }
})
