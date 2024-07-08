const { ProvablyFairNumbers } = require('./pfn')

describe('ProvablyFairNumbers', () => {
  let pfn

  beforeEach(() => {
    pfn = new ProvablyFairNumbers('clientSeed', 'serverSeed')
  })

  test('should generate a random hex string', () => {
    const hex = pfn.generateRandomHex(16)
    expect(hex).toHaveLength(16)
    expect(typeof hex).toBe('string')
  })

  test('should generate a server seed hash', () => {
    const hash = pfn.generateServerSeedHash()
    expect(hash).toHaveLength(64)
    expect(typeof hash).toBe('string')
  })

  test('should set the client seed', () => {
    pfn.setClientSeed('newClientSeed')
    expect(pfn.clientSeed).toBe('newClientSeed')
  })

  test('should generate a random long integer', () => {
    const randomLong = pfn.randomLong()
    expect(typeof randomLong).toBe('number')
  })

  test('should generate a random float between 0 and 1', () => {
    const random = pfn.random()
    expect(random).toBeGreaterThanOrEqual(0)
    expect(random).toBeLessThan(1)
  })

  test('should generate a random integer between min and max', () => {
    const randomInt = pfn.randomInt(1, 10)
    expect(randomInt).toBeGreaterThanOrEqual(1)
    expect(randomInt).toBeLessThanOrEqual(10)
  })

  test('should generate a random float with specified precision', () => {
    const randomFloat = pfn.randomFloat(1, 10, 2)
    expect(randomFloat).toBeGreaterThanOrEqual(1)
    expect(randomFloat).toBeLessThanOrEqual(10)
    expect(randomFloat.toString().split('.')[1].length).toBeLessThanOrEqual(2)
  })

  test('should increment nonce and generate a random float with specified precision', () => {
    const initialNonce = pfn.nonce
    const randomFloat = pfn.nextFloat(1, 10, 2)
    expect(randomFloat).toBeGreaterThanOrEqual(1)
    expect(randomFloat).toBeLessThanOrEqual(10)
    expect(randomFloat.toString().split('.')[1].length).toBeLessThanOrEqual(2)
    expect(pfn.nonce).toBe(initialNonce + 1)
  })
  
  test('should increment nonce and generate next random float', () => {
    const initialNonce = pfn.nonce
    pfn.next()
    expect(pfn.nonce).toBe(initialNonce + 1)
  })

  test('should increment nonce and generate next random integer', () => {
    const initialNonce = pfn.nonce
    const nextInt = pfn.nextInt(1, 10)
    expect(nextInt).toBeGreaterThanOrEqual(1)
    expect(nextInt).toBeLessThanOrEqual(10)
    expect(pfn.nonce).toBe(initialNonce + 1)
  })

  test('should generate an array of random integers', () => {
    const randomIntRange = pfn.randomIntRange(1, 10, 5)
    expect(randomIntRange.length).toBe(5)
    randomIntRange.forEach((num) => {
      expect(num).toBeGreaterThanOrEqual(1)
      expect(num).toBeLessThanOrEqual(10)
    })
  })

  test('should generate an array of unique random integers', () => {
    const min = 1
    const max = 10
    const size = 5
    const randomIntRange = pfn.randomIntRange(min, max, size, true)
    expect(randomIntRange.length).toBe(size)
    const uniqueValues = new Set(randomIntRange)
    expect(uniqueValues.size).toBe(size)
    randomIntRange.forEach(num => {
      expect(num).toBeGreaterThanOrEqual(min)
      expect(num).toBeLessThanOrEqual(max)
    })
  })

  test('should generate a weighted random number', () => {
    const spec = { a: 0.5, b: 0.5 }
    const weightedRandom = pfn.weightedRandom(spec)
    expect(['a', 'b']).toContain(weightedRandom)
  })

  test('should simulate a crash game', () => {
    const crashResult = pfn.crash()
    expect(crashResult).toBeGreaterThanOrEqual(1)
    expect(crashResult).toBeLessThanOrEqual(20000)
  })

  test('should shuffle an array', () => {
    const arr = [1, 2, 3, 4, 5]
    const shuffledArr = pfn.shuffle([...arr])
    expect(shuffledArr).not.toEqual(arr) // unlikely but possible to fail
    expect(shuffledArr.sort()).toEqual(arr.sort())
  })
})
