/**
 * 二维码生成器 — 微信小程序 Canvas 2D 版
 * 符合 ISO/IEC 18004 标准，支持 wx.scanCode 识别
 * 支持 Version 1-10，纠错级别 L
 */

// ===== GF(256) 有限域 =====
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(function initGF() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0)
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

function gfMul(a, b) {
  return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]
}

// ===== RS 纠错码 =====
function rsGeneratorPoly(degree) {
  let coeffs = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(coeffs.length + 1).fill(0)
    for (let j = 0; j < coeffs.length; j++) {
      next[j] ^= gfMul(coeffs[j], EXP[i])
      next[j + 1] ^= coeffs[j]
    }
    coeffs = next
  }
  return coeffs
}

function rsEncode(data, ecLen) {
  const gen = rsGeneratorPoly(ecLen)
  const result = new Array(ecLen).fill(0)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0]
    result.shift()
    result.push(0)
    for (let j = 0; j < ecLen; j++) {
      result[j] ^= gfMul(gen[j + 1], factor)
    }
  }
  return result
}

// ===== 版本参数 (Level L) =====
const VERSIONS = [
  null,
  { total: 26,  data: 19,  ec: 7,  groups: [[1, 19]] },
  { total: 44,  data: 34,  ec: 10, groups: [[1, 34]] },
  { total: 70,  data: 55,  ec: 15, groups: [[1, 55]] },
  { total: 100, data: 80,  ec: 20, groups: [[1, 80]] },
  { total: 134, data: 108, ec: 26, groups: [[1, 108]] },
  { total: 172, data: 136, ec: 18, groups: [[2, 68]] },
  { total: 196, data: 156, ec: 20, groups: [[2, 78]] },
  { total: 242, data: 194, ec: 24, groups: [[2, 97]] },
  { total: 292, data: 232, ec: 30, groups: [[2, 116]] },
  { total: 346, data: 274, ec: 36, groups: [[2, 137]] }
]

function selectVersion(dataBytes) {
  for (let v = 1; v <= 10; v++) {
    if (dataBytes <= VERSIONS[v].data) return v
  }
  return 10
}

// ===== 编码数据 =====
function encodeData(text, version) {
  const v = VERSIONS[version]
  const bits = []

  // 检测是否纯数字
  const isNumeric = /^\d+$/.test(text)
  const isAlphanumeric = /^[0-9A-Z $%*+\-./:]+$/.test(text)

  if (isNumeric && text.length >= 1) {
    // Numeric 模式 (0001)
    bits.push(0, 0, 0, 1)
    const ccBits = version <= 9 ? 10 : 12
    for (let i = ccBits - 1; i >= 0; i--) bits.push((text.length >> i) & 1)
    for (let i = 0; i < text.length; i += 3) {
      const group = text.substring(i, Math.min(i + 3, text.length))
      const val = parseInt(group, 10)
      const bitLen = group.length === 3 ? 10 : group.length === 2 ? 7 : 4
      for (let j = bitLen - 1; j >= 0; j--) bits.push((val >> j) & 1)
    }
  } else if (isAlphanumeric && text.length >= 1) {
    // Alphanumeric 模式 (0010)
    bits.push(0, 0, 1, 0)
    const ccBits = version <= 9 ? 9 : 11
    for (let i = ccBits - 1; i >= 0; i--) bits.push((text.length >> i) & 1)
    const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'
    for (let i = 0; i < text.length; i += 2) {
      if (i + 1 < text.length) {
        const val = CHARSET.indexOf(text[i]) * 45 + CHARSET.indexOf(text[i + 1])
        for (let j = 10; j >= 0; j--) bits.push((val >> j) & 1)
      } else {
        const val = CHARSET.indexOf(text[i])
        for (let j = 5; j >= 0; j--) bits.push((val >> j) & 1)
      }
    }
  } else {
    // Byte 模式 (0100)
    bits.push(0, 1, 0, 0)
    const ccBits = version <= 9 ? 8 : 16
    for (let i = ccBits - 1; i >= 0; i--) bits.push((text.length >> i) & 1)
    for (let i = 0; i < text.length; i++) {
      const byte = text.charCodeAt(i) & 0xFF
      for (let j = 7; j >= 0; j--) bits.push((byte >> j) & 1)
    }
  }

  // 终止符
  const totalBits = v.data * 8
  const termLen = Math.min(4, totalBits - bits.length)
  for (let i = 0; i < termLen; i++) bits.push(0)

  // 字节对齐
  while (bits.length % 8 !== 0) bits.push(0)

  // 填充字节
  const padBytes = [0xEC, 0x11]
  let padIdx = 0
  while (bits.length < totalBits) {
    const byte = padBytes[padIdx % 2]
    for (let j = 7; j >= 0; j--) bits.push((byte >> j) & 1)
    padIdx++
  }

  // 转字节数组
  const dataBytes = new Array(v.data)
  for (let i = 0; i < v.data; i++) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i * 8 + j] || 0)
    dataBytes[i] = byte
  }

  return dataBytes
}

// ===== 矩阵构建 =====
function createMatrix(version) {
  const size = version * 4 + 17
  const matrix = Array.from({ length: size }, () => new Array(size).fill(0))
  const reserved = Array.from({ length: size }, () => new Array(size).fill(0))
  return { matrix, reserved, size }
}

function placeFinderPattern(m, r, c, size) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
      const outer = dr === 0 || dr === 6 || dc === 0 || dc === 6
      const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
      m[nr][nc] = (outer || inner) ? 1 : -1
    }
  }
}

function placeAlignment(m, size, version) {
  if (version < 2) return
  const table = {
    2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  }
  const positions = table[version] || []
  for (const r of positions) {
    for (const c of positions) {
      if (r === 6 && c === 6) continue
      if (r === 6 && c === size - 7) continue
      if (r === size - 7 && c === 6) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const outer = Math.abs(dr) === 2 || Math.abs(dc) === 2
          const center = dr === 0 && dc === 0
          m[r + dr][c + dc] = (outer || center) ? 1 : -1
        }
      }
    }
  }
}

function buildMatrix(text) {
  const version = selectVersion(text.length)
  const v = VERSIONS[version]
  const { matrix, reserved, size } = createMatrix(version)

  // 1. 定位图案
  placeFinderPattern(matrix, 0, 0, size)
  placeFinderPattern(matrix, 0, size - 7, size)
  placeFinderPattern(matrix, size - 7, 0, size)

  // 标记保留区域
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (r < size && c < size) reserved[r][c] = 1
      if (r < size && c >= size - 8) reserved[r][c] = 1
    }
  }
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (r >= size - 8 && c < size) reserved[r][c] = 1
    }
  }

  // 时序图案
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = 1
    reserved[i][6] = 1
    matrix[6][i] = (i % 2 === 0) ? 1 : -1
    matrix[i][6] = (i % 2 === 0) ? 1 : -1
  }

  // 2. 对齐图案
  if (version >= 2) {
    const table = {
      2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
      6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
    }
    const positions = table[version] || []
    for (const r of positions) {
      for (const c of positions) {
        if (r === 6 && c === 6) continue
        if (r === 6 && c === size - 7) continue
        if (r === size - 7 && c === 6) continue
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            reserved[r + dr][c + dc] = 1
          }
        }
      }
    }
    placeAlignment(matrix, size, version)
  }

  // 3. 编码数据
  const dataBytes = encodeData(text, version)
  const ecBytes = rsEncode(dataBytes, v.ec)

  // 交织
  const allBytes = []
  for (let i = 0; i < dataBytes.length; i++) allBytes.push(dataBytes[i])
  for (let i = 0; i < ecBytes.length; i++) allBytes.push(ecBytes[i])

  // 转位流
  const bitStream = []
  for (const byte of allBytes) {
    for (let j = 7; j >= 0; j--) bitStream.push((byte >> j) & 1)
  }

  // 4. 放置数据位（蛇形走位）
  let bitIdx = 0
  let upward = true
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i)
    for (const row of rows) {
      for (let dc = 0; dc >= -1; dc--) {
        const col = right + dc
        if (col < 0 || col >= size) continue
        if (reserved[row][col]) continue
        matrix[row][col] = bitIdx < bitStream.length ? (bitStream[bitIdx] ? 1 : -1) : -1
        bitIdx++
      }
    }
    upward = !upward
  }

  // 5. 掩码（Pattern 0: (row + col) % 2 === 0）
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && (r + c) % 2 === 0) {
        matrix[r][c] = -matrix[r][c]
      }
    }
  }

  // 6. 格式信息（Level L = 01, Mask 0 = 000 → 数据位 01 000）
  //    BCH(15,5) 编码后的完整 15 位格式信息
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]

  // 写入格式信息 — 水平（第8行）
  const hPositions = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ]
  // 写入格式信息 — 垂直（第8列）
  const vPositions = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
  ]

  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] ? 1 : -1
    const [hr, hc] = hPositions[i]
    if (hr < size && hc < size) matrix[hr][hc] = bit
    const [vr, vc] = vPositions[i]
    if (vr >= 0 && vr < size && vc >= 0 && vc < size) matrix[vr][vc] = bit
  }

  // 暗模块
  matrix[size - 8][8] = 1

  return { matrix, size }
}

// ===== 绘制函数 =====

/**
 * 在 Canvas 2D 上下文绘制二维码
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text - 编码内容
 * @param {number} x
 * @param {number} y
 * @param {number} cellSize - 每模块像素
 * @param {string} fgColor
 * @param {string} bgColor
 * @param {number} canvasSize - canvas 尺寸（居中用）
 */
function drawQRToCtx(ctx, text, x, y, cellSize, fgColor, bgColor, canvasSize) {
  fgColor = fgColor || '#000000'
  bgColor = bgColor || '#FFFFFF'

  const { matrix, size } = buildMatrix(text)
  const qrPixelSize = size * cellSize

  let offsetX = x
  let offsetY = y
  if (canvasSize) {
    offsetX = Math.max(x, Math.floor((canvasSize - qrPixelSize) / 2))
    offsetY = Math.max(y, Math.floor((canvasSize - qrPixelSize) / 2))
  }

  // 背景
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasSize || (qrPixelSize + cellSize * 2), canvasSize || (qrPixelSize + cellSize * 2))

  // 二维码
  ctx.fillStyle = fgColor
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize)
      }
    }
  }
}

/**
 * 在旧版 Canvas 上绘制二维码（兼容）
 */
function drawQR(ctx, text, x, y, cellSize, fgColor, bgColor) {
  fgColor = fgColor || '#000000'
  bgColor = bgColor || '#FFFFFF'

  const { matrix, size } = buildMatrix(text)

  ctx.setFillStyle(bgColor)
  ctx.fillRect(x - cellSize, y - cellSize, (size + 2) * cellSize, (size + 2) * cellSize)

  ctx.setFillStyle(fgColor)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize)
      }
    }
  }
}

module.exports = { drawQR, drawQRToCtx, buildMatrix }
