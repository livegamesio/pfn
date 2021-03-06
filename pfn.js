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
    if (clientSeed) this.setClientSeed(clientSeed)
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
    if (!this.clientSeed) this.clientSeed = this.setClientSeed(this.generateRandomHex(64))
    const s = this.clientSeed + '-' + this.nonce
    const h = crypto.createHmac('sha256', this.serverSeed).update(s).digest('hex')
    return parseInt(h, 16) / Math.pow(2, 256)
  }

  //
  randomInt (min = 0, max = 100) {
    return Math.floor((this.random() * (max - min + 1)) + min)
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
    const t=[]
    for (let i in spec) {
      for (let j=0; j<spec[i]*10; j++) {
        t.push(i)
      }
    }
    return t[this.randomInt(0, t.length - 1)]
  }

  //
}

module.exports = { ProvablyFairNumbers }
