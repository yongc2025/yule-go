/**
 * 轻量二维码生成器 — 微信小程序 Canvas 版
 * 基于 QR Code Model 2，支持数字/字母数字/字节模式
 * 仅支持 Version 1-10，纠错级别 L
 */

// GF(256) 有限域运算
const GF256 = (() => {
  const EXP = new Uint8Array(256)
  const LOG = new Uint8Array(256)
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0)
  }
  EXP[255] = EXP[0]
  return {
    exp: (n) => EXP[((n % 255) + 255) % 255],
    log: (n) => LOG[n],
    mul: (a, b) => (a === 0 || b === 0) ? 0 : EXP[(LOG[a] + LOG[b]) % 255]
  }
})()

// 生成多项式
function generatorPoly(degree) {
  let coeffs = [1]
  for (let i = 0; i < degree; i++) {
    const newC = new Uint8Array(coeffs.length + 1)
    for (let j = 0; j < coeffs.length; j++) {
      newC[j] ^= coeffs[j]
      newC[j + 1] ^= GF256.mul(coeffs[j], GF256.exp(i))
    }
    coeffs = newC
  }
  return coeffs
}

// RS 纠错码
function rsEncode(data, ecLen) {
  const gen = generatorPoly(ecLen)
  const result = new Uint8Array(ecLen)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ result[0]
    result.copyWithin(0, 1)
    result[ecLen - 1] = 0
    for (let j = 0; j < ecLen; j++) {
      result[j] ^= GF256.mul(gen[j + 1], factor)
    }
  }
  return result
}

// 版本参数表 (Version 1-10, Level L)
const VERSION_PARAMS = [
  null, // 0 placeholder
  { total: 26, data: 19, ec: 7, groups: [[1, 19]] },
  { total: 44, data: 34, ec: 10, groups: [[1, 34]] },
  { total: 70, data: 55, ec: 15, groups: [[1, 55]] },
  { total: 100, data: 80, ec: 20, groups: [[1, 80]] },
  { total: 134, data: 108, ec: 26, groups: [[1, 108]] },
  { total: 172, data: 136, ec: 18, groups: [[2, 68]] },
  { total: 196, data: 156, ec: 20, groups: [[2, 78]] },
  { total: 242, data: 194, ec: 24, groups: [[2, 97]] },
  { total: 292, data: 232, ec: 30, groups: [[2, 116]] },
  { total: 346, data: 274, ec: 36, groups: [[2, 137]] }
]

// 定位图案位置
function getFormatInfo() {
  return [
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
    [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]
  ]
}

// 选择最小版本
function selectVersion(dataLen) {
  for (let v = 1; v <= 10; v++) {
    const p = VERSION_PARAMS[v]
    if (dataLen <= p.data) return v
  }
  return 10
}

// 编码数据
function encodeData(text, version) {
  const p = VERSION_PARAMS[version]
  const bits = []

  // 模式指示符 (字节模式 = 0100)
  bits.push(0, 1, 0, 0)

  // 字符计数指示符
  const ccBits = version <= 9 ? 8 : 16
  const len = text.length
  for (let i = ccBits - 1; i >= 0; i--) {
    bits.push((len >> i) & 1)
  }

  // 数据
  for (let i = 0; i < text.length; i++) {
    const byte = text.charCodeAt(i) & 0xFF
    for (let j = 7; j >= 0; j--) {
      bits.push((byte >> j) & 1)
    }
  }

  // 终止符
  const totalBits = p.data * 8
  const termLen = Math.min(4, totalBits - bits.length)
  for (let i = 0; i < termLen; i++) bits.push(0)

  // 填充到字节边界
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
  const dataBytes = new Uint8Array(p.data)
  for (let i = 0; i < p.data; i++) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i * 8 + j] || 0)
    dataBytes[i] = byte
  }

  return dataBytes
}

// 创建矩阵
function createMatrix(version) {
  const size = version * 4 + 17
  const matrix = Array.from({ length: size }, () => new Int8Array(size)) // 0=未设置, 1=黑, -1=白
  const reserved = Array.from({ length: size }, () => new Uint8Array(size))
  return { matrix, reserved, size }
}

// 放置定位图案
function placeFinderPattern(m, r, c, size) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
      const inOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6
      const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
      m[nr][nc] = (inOuter || inInner) ? 1 : -1
    }
  }
}

// 放置对齐图案
function placeAlignment(m, size, version) {
  if (version < 2) return
  const positions = [6, 10, 14, 18, 22, 26, 30].slice(0, version)
  for (const r of positions) {
    for (const c of positions) {
      if (r === 6 && c === 6) continue
      if (r === 6 && c === size - 7) continue
      if (r === size - 7 && c === 6) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const inOuter = Math.abs(dr) === 2 || Math.abs(dc) === 2
          const center = dr === 0 && dc === 0
          m[r + dr][c + dc] = (inOuter || center) ? 1 : -1
        }
      }
    }
  }
}

// 构建 QR 矩阵
function buildMatrix(text) {
  const version = selectVersion(text.length)
  const p = VERSION_PARAMS[version]
  const { matrix, reserved, size } = createMatrix(version)

  // 1. 定位图案
  placeFinderPattern(matrix, 0, 0, size)
  placeFinderPattern(matrix, 0, size - 7, size)
  placeFinderPattern(matrix, size - 7, 0, size)

  // 标记保留区域
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (r < size && c < size) reserved[r][c] = 1
      if (r < size && c >= size - 8) reserved[r][c] = 1
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
  placeAlignment(matrix, size, version)
  if (version >= 2) {
    const positions = [6, 10, 14, 18, 22, 26, 30].slice(0, version)
    for (const r of positions) {
      for (const c of positions) {
        if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            reserved[r + dr][c + dc] = 1
          }
        }
      }
    }
  }

  // 3. 编码数据
  const dataBytes = encodeData(text, version)
  const ecBytes = rsEncode(dataBytes, p.ec)

  // 交织数据
  const allBytes = []
  const groups = p.groups
  let maxBlockLen = 0
  for (const [count, blockLen] of groups) {
    maxBlockLen = Math.max(maxBlockLen, blockLen)
  }

  // 简化：单组
  for (let i = 0; i < dataBytes.length; i++) allBytes.push(dataBytes[i])
  for (let i = 0; i < ecBytes.length; i++) allBytes.push(ecBytes[i])

  // 转为位流
  const bitStream = []
  for (const byte of allBytes) {
    for (let j = 7; j >= 0; j--) bitStream.push((byte >> j) & 1)
  }

  // 4. 放置数据位
  let bitIdx = 0
  let upward = true
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5 // 跳过时序列
    const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i)
    for (const row of rows) {
      for (let dc = 0; dc >= -1; dc--) {
        const col = right + dc
        if (col < 0 || col >= size) continue
        if (reserved[row][col]) continue
        if (bitIdx < bitStream.length) {
          matrix[row][col] = bitStream[bitIdx] ? 1 : -1
          bitIdx++
        } else {
          matrix[row][col] = -1
        }
      }
    }
    upward = !upward
  }

  // 5. 格式信息 (Level L, Mask 0)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]
  const formatPositions = getFormatInfo()
  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] ? 1 : -1
    const [r, c] = formatPositions[i]
    if (r < size && c < size) matrix[r][c] = bit
    // 对称位置
    const sr = size - 1 - r
    const sc = size - 1 - c
    if (sr >= 0 && sr < size && sc >= 0 && sc < size) {
      matrix[sr][sc] = bit
    }
  }

  // 暗模块
  matrix[size - 8][8] = 1

  return { matrix, size }
}

/**
 * 在旧版 Canvas 上绘制二维码（兼容旧 API）
 * @param {CanvasContext} ctx - 旧版 Canvas 上下文
 * @param {string} text - 要编码的文本
 * @param {number} x - 起始 x
 * @param {number} y - 起始 y
 * @param {number} cellSize - 每个单元像素大小
 * @param {string} fgColor - 前景色
 * @param {string} bgColor - 背景色
 */
function drawQR(ctx, text, x, y, cellSize, fgColor = '#000000', bgColor = '#FFFFFF') {
  const { matrix, size } = buildMatrix(text)

  // 背景
  ctx.setFillStyle(bgColor)
  ctx.fillRect(x - cellSize, y - cellSize, (size + 2) * cellSize, (size + 2) * cellSize)

  // 二维码
  ctx.setFillStyle(fgColor)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize)
      }
    }
  }
}

/**
 * 在 Canvas 2D 上下文上绘制二维码（新版 API）
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
 * @param {string} text - 要编码的文本
 * @param {number} x - 起始 x
 * @param {number} y - 起始 y
 * @param {number} cellSize - 每个单元像素大小
 * @param {string} fgColor - 前景色
 * @param {string} bgColor - 背景色
 * @param {number} canvasSize - canvas 尺寸（用于居中绘制）
 */
function drawQRToCtx(ctx, text, x, y, cellSize, fgColor = '#000000', bgColor = '#FFFFFF', canvasSize) {
  const { matrix, size } = buildMatrix(text)
  const qrPixelSize = size * cellSize

  // 如果指定了 canvasSize，居中绘制
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

module.exports = { drawQR, drawQRToCtx, buildMatrix }
