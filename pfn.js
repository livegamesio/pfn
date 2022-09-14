const crypto = require('crypto')

/**
 * Provably Fair Numbers
 *
 * @name ProvablyFairNumbers
 * @copyright LiveGames 2022
 */
class ProvablyFairNumbers {
  //
  constructor (clientSeed, serverSeed) {
    this.serverSeed = serverSeed || this.generateRandomHex(64)
    this.serverHash = this.generateServerSeedHash()
    //
    if (clientSeed || clientSeed === 0) this.setClientSeed(String(clientSeed))
    //
    this.nonce = 0
  }

  //
  setClientSeed (seed) {
    this.clientSeed = seed
  }

  //
  generateRandomHex (length) {
    return crypto.randomBytes(Date.now() / 10000).toString('hex').slice(0, length)
  }

  //
  generateServerSeedHash () {
    return crypto.createHash('sha256').update(this.serverSeed).digest('hex')
  }

  //
  random () {
    if (!this.clientSeed) this.setClientSeed(this.generateRandomHex(64))
    const s = this.clientSeed + '-' + this.nonce
    const h = crypto.createHmac('sha256', this.serverSeed).update(s).digest('hex')
    return parseInt(h, 16) / Math.pow(2, 256)
  }

  //
  randomInt (min = 0, max = 100) {
    const range = (max - min + 1)
    const maxRange = Math.floor(2**32 / range) * range
    let c = 0
    do {
        if (c) this.nonce++
        var x = Math.floor(this.random() * 2**32)
        c++
    } while (x >= maxRange)
    return (x % range) + min
  }

  //
  next () {
    this.nonce++
    return this.random()
  }

  //
  nextInt (min, max) {
    this.nonce++
    return this.randomInt(min, max)
  }

  //
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

  //
  weightedRandom (spec) {
    const t = []
    for (const i in spec) {
      for (let j = 0; j < spec[i] * 10; j++) {
        t.push(i)
      }
    }
    return t[this.randomInt(0, t.length - 1)]
  }

  //
}

module.exports = { ProvablyFairNumbers }
