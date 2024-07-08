const crypto = require('crypto')

/**
 * Provably Fair Numbers
 *
 * @name ProvablyFairNumbers
 * @copyright LiveGames 2024
 */
class ProvablyFairNumbers {
  //
  constructor (clientSeed, serverSeed, nonce = 0) {
    this.serverSeed = serverSeed || this.generateRandomHex(64)
    this.serverHash = this.generateServerSeedHash()
    // Set client seed if provided
    if (clientSeed || clientSeed === 0) this.setClientSeed(String(clientSeed))
    this.nonce = nonce || 0
  }

  // Set the client seed
  setClientSeed (seed) {
    this.clientSeed = seed
  }

  // Generate a random hexadecimal string of specified length
  generateRandomHex (length = 16) {
    return crypto.randomBytes(length).toString('hex').slice(0, length)
  }

  // Generate a SHA-256 hash of the server seed
  generateServerSeedHash () {
    return crypto.createHash('sha256').update(this.serverSeed).digest('hex')
  }

  // Generate a random long integer
  randomLong () {
    if (!this.clientSeed) this.setClientSeed(this.generateRandomHex(64))
    const s = this.clientSeed + '-' + this.nonce
    const h = crypto.createHmac('sha256', this.serverSeed).update(s).digest('hex')
    return parseInt(h, 16)
  }

  // Generate a random float between 0 and 1
  random () {
    return this.randomLong() / Math.pow(2, 256)
  }

  // Generate a random integer between min and max
  randomInt (min = 0, max = 100) {
    const range = (max - min + 1)
    const maxRange = Math.floor(2 ** 32 / range) * range
    let i
    let c = 0
    do {
      if (c) this.nonce++
      i = Math.floor(this.random() * 2 ** 32)
      c++
    } while (i >= maxRange)
    return (i % range) + min
  }

  // Generate a random float between min and max with specified precision
  randomFloat (min = 0, max = 100, precision = 2) {
    return parseFloat((Math.round(this.random() * 10 ** precision) / 10 ** precision * (max - min) + min).toFixed(precision))
  }

  // Increment nonce and generate next random float
  next () {
    this.nonce++
    return this.random()
  }

  // Increment nonce and generate next random float between min and max with specified precision
  nextFloat (min = 0, max = 1, precision = 2) {
    this.nonce++
    return this.randomFloat(min, max, precision)
  }

  // Increment nonce and generate next random integer between min and max
  nextInt (min, max) {
    this.nonce++
    return this.randomInt(min, max)
  }

  // Generate an array of random integers between min and max with specified size
  // If unique is true, ensure all numbers are unique
  randomIntRange (min, max, size = 5, unique = false) {
    //
    if (unique && size > max) size = max

    //
    const r = { l: [] }
    if (unique) r.u = []

    //
    while (r[unique ? 'u' : 'l'].length < size) {
      const n = this.nextInt(min, max)
      if (unique && !(~r.u.indexOf(n))) r.u.push(n)
      r.l.push(n)
    }
    return r
  }

  // Generate a weighted random number based on the given spec
  weightedRandom (spec) {
    const t = []
    for (const i in spec) {
      for (let j = 0; j < spec[i] * 10; j++) {
        t.push(i)
      }
    }
    return t[this.randomInt(0, t.length - 1)]
  }

  // Simulate a crash game with a specified house edge and max value
  crash (houseEdge = 1, max = 20000) {
    let X = this.random()
    X = (100 - houseEdge) / (1 - X)
    return Math.min(Math.max(1, Math.floor(X) / 100), max)
  }

  // Shuffle an array using the Fisher-Yates algorithm
  shuffle (arr) {
    let t
    let i
    let m = arr.length
    while (m) {
      i = this.nextInt(0, m--)
      t = arr[m]
      arr[m] = arr[i]
      arr[i] = t
    }
    return arr
  }
}

module.exports = { ProvablyFairNumbers }
