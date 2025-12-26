const crypto = require('crypto')

/**
 * Provably Fair Numbers V2
 *
 * @name ProvablyFairNumbers
 * @copyright LiveGames 2025
 *
 * Constructor parameters:
 * @param {string|string[]} clientSeed - Primary client seed or array of user seeds (joins with '|')
 * @param {string} serverSeed - Server seed for HMAC
 * @param {number} nonce - Starting nonce value (default: 0)
 * @param {number|null} index - Index mode instead of nonce (default: null)
 */
class ProvablyFairNumbersV2 {
  constructor (clientSeed, serverSeed, nonce = 0, index = null) {
    this.serverSeed = serverSeed || this.generateRandomHex(64)
    this.serverHash = this.generateServerSeedHash()
    if (clientSeed || clientSeed === 0) {
      this.setClientSeed(Array.isArray(clientSeed) ? clientSeed.join('|') : String(clientSeed))
    }
    this.nonce = nonce || 0
    this.index = (index === null || index === undefined) ? null : index
  }

  // --- Seed & hashing --------------------------------------------------------

  setClientSeed (seed) {
    this.clientSeed = seed
  }

  generateRandomHex (length = 16) {
    const byteLength = (length + 1) >>> 1 // (length + 1) / 2, integer division
    return crypto.randomBytes(byteLength).toString('hex').slice(0, length)
  }

  generateServerSeedHash () {
    return crypto.createHash('sha256').update(this.serverSeed).digest('hex')
  }

  // Advance the state: if index-mode is enabled, increment index; else increment nonce
  nextIndex () {
    return (this.index === null) ? (++this.nonce) : (++this.index)
  }

  // --- Core HMAC helpers -----------------------------------------------------

  // Compute HMAC without advancing state (for backward compatibility)
  _currentHmacBuf () {
    if (!this.clientSeed) this.setClientSeed(this.generateRandomHex(64))

    // Cache optimization: avoid string concatenation on every call
    const indexPart = (this.index !== null ? ('-' + this.index) : '')
    const s = this.clientSeed + '-' + this.nonce + indexPart

    // Use digest() directly without intermediate variables for slight perf gain
    return crypto.createHmac('sha256', this.serverSeed).update(s).digest()
  }

  // Get first N bytes from current HMAC
  getBytes (count = 4) {
    const buf = this._currentHmacBuf()
    return buf.subarray(0, Math.min(count, buf.length))
  }

  // Convert bytes to float value
  bytesToFloat (bytes) {
    if (!bytes || bytes.length === 0) return 0
    let result = 0
    for (let i = 0; i < bytes.length; i++) {
      result += bytes[i] / Math.pow(256, i + 1)
    }
    return result
  }

  // 256-bit BigInt (does not advance state)
  randomLong () {
    const buf = this._currentHmacBuf()

    // Optimized: Direct buffer to BigInt conversion without hex string
    // This is faster than string conversion for large values
    let result = 0n
    for (let i = 0; i < 32; i++) {
      result = (result << 8n) | BigInt(buf[i])
    }
    return result
  }

  // --- Uniform PRNGs ---------------------------------------------------------

  // Uniform float in [0,1) using 52-bit mantissa (does not advance state)
  random () {
    const buf = this._currentHmacBuf() // 32 bytes

    // Optimized: read 64-bit value and mask to 52 bits for better performance
    const hi32 = buf.readUInt32BE(0)
    const lo32 = buf.readUInt32BE(4)

    // Combine to 52-bit mantissa: take 32 bits + top 20 bits of next 32 bits
    // This avoids the expensive multiplication and uses bitwise ops
    const mantissa = (hi32 * 0x100000) + (lo32 >>> 12) // 2^20 = 0x100000

    // Use pre-calculated constant for division (2^52)
    const r = mantissa * 2.220446049250313e-16 // 1 / 2^52

    // Theoretical guard (extremely rare case)
    return r >= 1 ? 1 - Number.EPSILON : r
  }

  // Unbiased integer in [min, max] via rejection sampling
  randomInt (min = 0, max = 100) {
    if (max < min) throw new Error('randomInt: max < min')
    const range = max - min + 1
    const maxRange = Math.floor(2 ** 32 / range) * range
    let i
    let c = 0
    do {
      if (c) this.nextIndex() // Advance state only on rejection
      i = Math.floor(this.random() * 2 ** 32) // random() doesn't advance state
      c++
    } while (i >= maxRange)
    return (i % range) + min
  }

  // Float in [min, max) with rounding to "precision" using standard rounding
  // If you need floor rounding, apply it externally.
  randomFloat (min = 0, max = 100, precision = 2) {
    if (max < min) throw new Error('randomFloat: max < min')
    const v = min + this.random() * (max - min)
    return parseFloat(v.toFixed(precision))
  }

  // Convenience wrappers (advance state explicitly)
  next () {
    this.nextIndex()
    return this.random()
  }

  nextFloat (min = 0, max = 1, precision = 2) {
    this.nextIndex()
    return this.randomFloat(min, max, precision)
  }

  nextInt (min, max) {
    this.nextIndex()
    return this.randomInt(min, max)
  }

  // --- Collections & weighted picks -----------------------------------------

  // Array of integers; if unique=true ensure uniqueness
  randomIntRange (min, max, size = 5, unique = false) {
    if (max < min) throw new Error('randomIntRange: max < min')
    if (size < 0) size = 0

    if (unique) {
      const domain = max - min + 1
      if (size > domain) size = domain
      const picked = new Set()
      const list = []
      while (list.length < size) {
        const n = this.nextInt(min, max)
        if (!picked.has(n)) {
          picked.add(n)
          list.push(n)
        }
      }
      return { l: list }
    } else {
      const list = []
      for (let i = 0; i < size; i++) list.push(this.nextInt(min, max))
      return { l: list }
    }
  }

  // Weighted random pick: spec = { key: weight, ... }
  weightedRandom (spec) {
    // Optimized: single pass through object properties
    let total = 0
    const validEntries = []

    // Collect valid entries and calculate total in one pass
    for (const key in spec) {
      if (Object.prototype.hasOwnProperty.call(spec, key)) {
        const weight = Number(spec[key])
        if (Number.isFinite(weight) && weight > 0) {
          validEntries.push([key, weight])
          total += weight
        }
      }
    }

    if (validEntries.length === 0) return undefined

    let t = this.random() * total
    // Use for loop instead of for...of for better performance
    for (let i = 0; i < validEntries.length; i++) {
      t -= validEntries[i][1]
      if (t < 0) return validEntries[i][0]
    }
    return validEntries[validEntries.length - 1][0] // fallback
  }

  // --- Shuffling -------------------------------------------------------------
  // Fisher-Yates shuffle (unbiased)
  shuffle (arr) {
    let m = arr.length
    while (m) {
      const i = this.nextInt(0, --m)
      const t = arr[m]
      arr[m] = arr[i]
      arr[i] = t
    }
    return arr
  }

  // --- Crash ---------------------------------------------------------------
  /**
   * Crash multiplier:
   *   raw = (1 - ε) / (1 - r),  r ~ U[0,1), ε = houseEdge in [0,1]
   *   return floor(raw*100)/100 clamped to [1, max]
   *
   * houseEdge accepts 1 => %1 or 0.01 => %1 (auto-detect).
   */
  crash (houseEdge = 1, max = 1_000_000) {
    const eps = houseEdge >= 1 ? houseEdge / 100 : houseEdge
    let r = this.random()
    if (r >= 1) r = 1 - 1e-12 // guard
    const raw = (1 - eps) / (1 - r)
    const down2 = Math.floor(raw * 100) / 100
    return Math.min(Math.max(1, down2), max)
  }

  /**
   * Pump (Balloon) game
   *
   * Game mechanics:
   * - Player pumps balloon up to `size` times (default 25)
   * - Each pump increases the multiplier
   * - Balloon bursts at a random point determined by difficulty
   * - Player can cash out anytime before burst
   *
   * @param {Object} [opts]
   * @param {'easy'|'medium'|'hard'|'expert'|number} [opts.difficulty='medium'] - Burst points count
   * @param {number} [opts.size=25] - Maximum pumps
   * @param {number} [opts.edge=0.02] - House edge (default 2%)
   * @returns {{
   *   popPoint: number,                              // Burst point (1-indexed)
   *   payoutMultiplierAt: (round: number) => number, // Multiplier at given pump count
   *   survivalAt: (round: number) => number,         // Survival probability
   *   willPopNext: (round: number) => boolean,
   *   canPress: (round: number) => boolean,
   *   isPop: (round: number) => boolean
   * }}
   */
  pump (opts = {}) {
    if (opts.nonce !== undefined) this.nonce = opts.nonce
    if (opts.index !== undefined) this.index = opts.index

    const difficultyMap = opts.samples ?? { easy: 1, medium: 3, hard: 5, expert: 10 }
    const size = opts.size ?? 25
    const burstPoints = typeof opts.difficulty === 'number'
      ? opts.difficulty
      : (difficultyMap[opts.difficulty || 'medium'] || 3)
    const edge = opts.edge ?? 0.02

    if (!(Number.isInteger(size) && size >= 2)) throw new Error('pump: invalid size')
    if (!(Number.isInteger(burstPoints) && burstPoints >= 1 && burstPoints <= size)) {
      throw new Error('pump: invalid difficulty')
    }

    // Select burst positions using partial Fisher-Yates (unbiased)
    const positions = Array.from({ length: size }, (_, i) => i)
    let remaining = size
    let firstBurst = size

    for (let i = 0; i < burstPoints; i++) {
      const j = this.nextInt(0, remaining - 1)
      const selected = positions[j]
      if (selected < firstBurst) firstBurst = selected
      remaining--
      positions[j] = positions[remaining]
    }

    const popPoint = firstBurst + 1 // convert to 1-indexed

    // Survival probability at pump k: S(k) = Π_{t=0..k-1} (n - b - t) / (n - t)
    const survivalAt = k => {
      if (k <= 0) return 1
      if (k > size - burstPoints) return 0
      let s = 1
      for (let t = 0; t < k; t++) s *= (size - burstPoints - t) / (size - t)
      return s
    }

    const isPop = round => Number.isInteger(round) && round === popPoint
    const canPress = round => Number.isInteger(round) && round >= 0 && round < popPoint
    const willPopNext = round => Number.isInteger(round) && (round + 1 === popPoint)

    // Payout multiplier: (1 - edge) / S(k)
    const payoutMultiplierAt = round => {
      if (!Number.isInteger(round) || round < 0 || round >= popPoint) return 0
      const s = survivalAt(round)

      return s > 0 ? Number(BigInt(Math.round((1 - edge) * 10000)) * 100n / BigInt(Math.round(s * 10000))) / 100 : 0
    }

    return { size, burstPoints, popPoint, payoutMultiplierAt, survivalAt, willPopNext, canPress, isPop }
  }

  /**
   * High multiplier for games like Limbo:
   *   Uses first 4 bytes of HMAC as entropy source
   *   Formula: (2^24 / (floatValue * 2^24 + 1)) * (1 - houseEdge)
   *
   * @param {number} houseEdge - House edge (1 = %1, 0.01 = %1)
   * @param {number} maxMultiplier - Maximum multiplier cap (default: 1e6)
   * @returns {number} Multiplier value
   */
  highMultiplier (houseEdge = 0.01, maxMultiplier = 1_000_000, precision = 2) {
    const value = Math.floor(this.bytesToFloat(this.getBytes(4)) * 16777216)
    const eps = houseEdge >= 1 ? houseEdge / 100 : houseEdge
    return parseFloat((Math.min(Math.max(1, 16777216 / (value + 1) * (1 - eps)), maxMultiplier)).toFixed(precision))
  }

  //
}

module.exports = { ProvablyFairNumbersV2 }
