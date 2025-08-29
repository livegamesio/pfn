const { ProvablyFairNumbers } = require('../index.js')

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
    expect(typeof randomLong).toBe('bigint')
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

  test('should increment index and generate a random float with specified precision', () => {
    pfn = new ProvablyFairNumbers('clientSeed', 'serverSeed', 0, 0) // clientSeed, serverSeed, nonce, index

    const initialIndex = pfn.index
    const randomFloat = pfn.nextFloat(1, 10, 2)
    expect(randomFloat).toBeGreaterThanOrEqual(1)
    expect(randomFloat).toBeLessThanOrEqual(10)
    expect(randomFloat.toString().split('.')[1].length).toBeLessThanOrEqual(2)
    expect(pfn.index).toBe(initialIndex + 1)
  })

  test('should generate an array of random integers', () => {
    const randomIntRange = pfn.randomIntRange(1, 10, 5).l // list
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
    const result = pfn.randomIntRange(min, max, size, true)
    const randomIntRange = result.l // list (V2 only returns .l property)
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

  // --- Edge Cases & Error Handling ---

  test('should handle edge case: min equals max in randomInt', () => {
    const result = pfn.randomInt(5, 5)
    expect(result).toBe(5)
  })

  test('should handle edge case: size larger than range in randomIntRange', () => {
    const result = pfn.randomIntRange(1, 3, 10, true)
    expect(result.l.length).toBe(3) // should be clamped to range size
    const uniqueValues = new Set(result.l)
    expect(uniqueValues.size).toBe(3)
  })

  test('should handle empty weighted random spec', () => {
    const result = pfn.weightedRandom({})
    expect(result).toBeUndefined()
  })

  test('should handle zero weights in weighted random', () => {
    const result = pfn.weightedRandom({ a: 0, b: 0, c: 1 })
    expect(result).toBe('c')
  })

  test('should handle negative size in randomIntRange', () => {
    const result = pfn.randomIntRange(1, 10, -5)
    expect(result.l.length).toBe(0)
  })

  // --- Error Cases ---

  test('should throw error for max < min in randomInt', () => {
    expect(() => pfn.randomInt(10, 5)).toThrow('randomInt: max < min')
  })

  test('should throw error for max < min in randomFloat', () => {
    expect(() => pfn.randomFloat(10, 5)).toThrow('randomFloat: max < min')
  })

  test('should throw error for max < min in randomIntRange', () => {
    expect(() => pfn.randomIntRange(10, 5)).toThrow('randomIntRange: max < min')
  })

  // --- Security & Determinism ---

  test('should produce deterministic sequence with same seeds', () => {
    const pfn1 = new ProvablyFairNumbers('seed', 'server-seed', 0)
    const pfn2 = new ProvablyFairNumbers('seed', 'server-seed', 0)

    const seq1 = []
    const seq2 = []
    for (let i = 0; i < 10; i++) {
      seq1.push(pfn1.next())
      seq2.push(pfn2.next())
    }

    expect(seq1).toEqual(seq2)
  })

  test('should produce different sequences with different seeds', () => {
    const pfn1 = new ProvablyFairNumbers('seed1', 'server-seed')
    const pfn2 = new ProvablyFairNumbers('seed2', 'server-seed')

    const seq1 = []
    const seq2 = []
    for (let i = 0; i < 10; i++) {
      seq1.push(pfn1.next())
      seq2.push(pfn2.next())
    }

    expect(seq1).not.toEqual(seq2)
  })

  // --- Statistical Properties ---

  test('should generate values in correct range [0,1)', () => {
    for (let i = 0; i < 1000; i++) {
      const val = pfn.random()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })

  test('should not generate 1.0 (theoretical maximum)', () => {
    // This test may rarely fail due to the nature of random numbers
    // but it's very unlikely to generate exactly 1.0
    for (let i = 0; i < 10000; i++) {
      const val = pfn.random()
      expect(val).toBeLessThan(1)
    }
  })

  test('should handle very small ranges', () => {
    const results = []
    for (let i = 0; i < 100; i++) {
      results.push(pfn.randomInt(0, 1))
    }
    expect(results.every(r => r === 0 || r === 1)).toBe(true)
  })

  // --- Crash Game Specific Tests ---

  test('should handle crash edge cases', () => {
    // 100% house edge should always return 1
    const result = pfn.crash(100)
    expect(result).toBe(1)

    // Test that crash results are within bounds
    for (let i = 0; i < 100; i++) {
      const crashResult = pfn.crash(1, 100) // 1% house edge, max 100x
      expect(crashResult).toBeGreaterThanOrEqual(1)
      expect(crashResult).toBeLessThanOrEqual(100)
    }
  })

  // --- Performance Tests ---

  test('should handle large ranges efficiently', () => {
    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      pfn.randomInt(0, 1000000)
    }
    const end = Date.now()
    expect(end - start).toBeLessThan(1000) // Should complete in less than 1 second
  })

  test('should handle large arrays for shuffling', () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i)
    const start = Date.now()
    const shuffled = pfn.shuffle([...largeArray])
    const end = Date.now()

    expect(shuffled.length).toBe(1000)
    expect(new Set(shuffled).size).toBe(1000) // All unique values
    expect(end - start).toBeLessThan(100) // Should be very fast
  })
})
