/**
 * Mock 数据 — 用于前端设计验证
 * 后续对接真实 API 后可删除
 */

// 当前门店
export const mockMerchant = {
  id: 1,
  name: '老王渔具',
  ownerName: '老王',
  ownerAvatar: '👨‍🌾',
  ownerTitle: '金牌领队',
  slogan: '周末去哪？跟我走！',
  serviceCount: 268,
  rating: 4.9,
  ratingCount: 128,
  coverImage: '',
  latitude: 28.2282,
  longitude: 112.9828,
  address: '长沙市芙蓉区五一大道88号',
  phone: '138-XXXX-8888',
  businessHours: '08:00-20:00',
  distance: 1.2,
  images: [],
  videoUrl: '',
  weeklyActivities: 3
}

// 门店列表（发现页用）
export const mockMerchants = [
  {
    id: 1,
    name: '老王渔具',
    ownerAvatar: '👨‍🌾',
    rating: 4.9,
    serviceCount: 268,
    distance: 1.2,
    weeklyActivities: 3,
    hotActivity: '成人垂钓团 ¥128',
    gradient: 'linear-gradient(135deg, #264653 0%, #2A9D8F 100%)'
  },
  {
    id: 2,
    name: '钓友之家',
    ownerAvatar: '🧑',
    rating: 4.7,
    serviceCount: 156,
    distance: 3.5,
    weeklyActivities: 2,
    hotActivity: '露营垂钓套餐 ¥168',
    gradient: 'linear-gradient(135deg, #606C38 0%, #DDA15E 100%)'
  },
  {
    id: 3,
    name: '山水间户外',
    ownerAvatar: '👩',
    rating: 4.8,
    serviceCount: 89,
    distance: 5.8,
    weeklyActivities: 4,
    hotActivity: '亲子户外游 ¥198',
    gradient: 'linear-gradient(135deg, #457B9D 0%, #A8DADC 100%)'
  }
]

// 活动列表
export const mockActivities = [
  {
    id: 1,
    name: '成人钓友单日垂钓团',
    type: 'fishing',
    date: '5月9日',
    dayOfWeek: '周六',
    time: '07:00-16:00',
    price: 128,
    priceUnit: '/人',
    remainingSlots: 3,
    tags: ['🎣 专属钓点', '🚌 车接车送', '🍱 含午餐'],
    gradient: 'linear-gradient(135deg, #264653 0%, #2A9D8F 100%)',
    emoji: '🎣',
    includes: ['往返车费', '专属钓点', '基础饵料', '领队服务', '饮用水', '出行保险'],
    excludes: ['个人渔具', '午餐（农家AA）', '其他个人消费'],
    itinerary: [
      { time: '07:00', label: '渔具店集合发车 🚌' },
      { time: '08:00', label: '抵达专属钓点，讲解安全垂钓规则 🎣' },
      { time: '08:30 - 11:30', label: '专业垂钓，领队现场指导 🐟' },
      { time: '11:30 - 13:00', label: '农家午餐 + 休息 🍚' },
      { time: '13:00 - 16:00', label: '下午垂钓交流 🎣' },
      { time: '16:00', label: '集合返程 🚌' }
    ],
    meetingPoint: { name: '老王渔具店门口', address: '长沙市芙蓉区五一大道88号' },
    spot: { name: '松雅湖垂钓中心', fishTypes: '鲫鱼 鲤鱼 草鱼', facilities: '有停车位', distance: '15km', driveTime: '约30分钟车程' }
  },
  {
    id: 2,
    name: '垂钓+露营一日套餐',
    type: 'camping',
    date: '5月10日',
    dayOfWeek: '周日',
    time: '08:00-17:00',
    price: 198,
    priceUnit: '/人',
    remainingSlots: 8,
    tags: ['⛺ 露营装备全包', '🎣 含钓具', '🍖 户外野餐'],
    gradient: 'linear-gradient(135deg, #606C38 0%, #DDA15E 100%)',
    emoji: '⛺'
  },
  {
    id: 3,
    name: '亲子出游套餐',
    type: 'family',
    date: '5月10日',
    dayOfWeek: '周日',
    time: '08:30-16:00',
    price: 238,
    priceUnit: '/一大一小',
    childPrice: 68,
    remainingSlots: 5,
    tags: ['👨‍👩‍👧 趣味钓鱼', '🎮 亲子游戏', '🧺 露营野餐'],
    gradient: 'linear-gradient(135deg, #BC6C25 0%, #FEFAE0 100%)',
    emoji: '👨‍👩‍👧'
  },
  {
    id: 4,
    name: '退休专属慢游单日团',
    type: 'senior',
    date: '5月9日',
    dayOfWeek: '周六',
    time: '08:30-15:30',
    price: 98,
    priceUnit: '/人',
    remainingSlots: 12,
    tags: ['🌅 休闲观光', '🍲 农家午餐', '🚗 全程接送'],
    gradient: 'linear-gradient(135deg, #457B9D 0%, #A8DADC 100%)',
    emoji: '👴'
  }
]

// 装备租赁
export const mockRentalItems = [
  { id: 1, name: '鱼竿套装', emoji: '🎣', price: 30, unit: '套' },
  { id: 2, name: '帐篷', emoji: '⛺', price: 50, unit: '顶' },
  { id: 3, name: '天幕', emoji: '🏕️', price: 40, unit: '个' },
  { id: 4, name: '折叠桌椅', emoji: '🪑', price: 25, unit: '套' }
]

// 档期
export const mockSchedules = [
  { id: 1, date: '5/9', dayOfWeek: '周六', remainingSlots: 3, isHot: true },
  { id: 2, date: '5/10', dayOfWeek: '周日', remainingSlots: 8, isHot: false },
  { id: 3, date: '5/16', dayOfWeek: '周六', remainingSlots: 15, isHot: false }
]

// 评价
export const mockReviews = [
  {
    id: 1,
    userName: '钓鱼老张',
    userEmoji: '🧑',
    date: '2026-05-04',
    activityName: '成人垂钓团',
    rating: 5,
    content: '老王人很实在，钓点选得好，上午就钓了七八条鲫鱼。中午农家菜也好吃，下次还来！',
    bgColor: '#E8F5E9'
  },
  {
    id: 2,
    userName: '小鱼妈妈',
    userEmoji: '👩',
    date: '2026-05-03',
    activityName: '亲子出游套餐',
    rating: 5,
    content: '带孩子去的，玩得很开心！领队很耐心教小朋友钓鱼，午餐也不错。推荐给其他宝妈～',
    bgColor: '#FFF3E0'
  }
]

// 用户信息
export const mockUser = {
  id: 1,
  nickname: '钓鱼达人小李',
  avatar: '🧑',
  phone: '138****8888',
  memberLevel: '金卡会员',
  balance: 380.00,
  totalRecharge: 500,
  discount: 0.9,
  inviteCode: 'YL8888'
}

// 订单列表
export const mockOrders = [
  {
    id: 1,
    orderNo: 'YL20260509001',
    status: 'paid',
    statusText: '已支付',
    date: '2026-05-09',
    dayOfWeek: '周六',
    activityName: '成人钓友单日垂钓团',
    activityEmoji: '🎣',
    gradient: 'linear-gradient(135deg, #264653, #2A9D8F)',
    adultCount: 2,
    childCount: 0,
    totalAmount: 266.40,
    checkinCode: '839261',
    collectionTime: '07:00',
    merchantName: '老王渔具'
  },
  {
    id: 2,
    orderNo: 'YL20260503001',
    status: 'completed',
    statusText: '已完成',
    date: '2026-05-03',
    dayOfWeek: '周六',
    activityName: '亲子出游套餐',
    activityEmoji: '👨‍👩‍👧',
    gradient: 'linear-gradient(135deg, #BC6C25, #FEFAE0)',
    adultCount: 1,
    childCount: 1,
    totalAmount: 238.00,
    checkinCode: '451827',
    collectionTime: '08:30',
    merchantName: '老王渔具'
  }
]

// 用户去过的店
export const mockUserShops = [
  {
    merchantId: 1,
    name: '老王渔具',
    ownerAvatar: '👨‍🌾',
    distance: 1.2,
    weeklyActivities: 3,
    isPrimary: true,
    gradient: 'linear-gradient(135deg, #F4A261, #E76F51)'
  },
  {
    merchantId: 2,
    name: '钓友之家',
    ownerAvatar: '🧑',
    distance: 3.5,
    weeklyActivities: 2,
    isPrimary: false,
    lastVisit: '4天前',
    gradient: 'linear-gradient(135deg, #606C38, #DDA15E)'
  }
]
