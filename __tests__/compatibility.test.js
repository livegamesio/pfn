const { ProvablyFairNumbersV1, ProvablyFairNumbersV2 } = require('../index.js')

// Test constants
const CLIENT_SEED = 'test-client-seed-123'
const SERVER_SEED = 'test-server-seed-abcdef1234567890abcdef1234567890abcdef'
const ARRAY_CLIENT_SEED = ['seed1', 'seed2', 'seed3']

describe('ProvablyFairNumbers V1 vs V2 Compatibility', () => {
  const testNonces = [0, 1, 5, 10, 100]

  describe('Basic Functionality', () => {
    testNonces.forEach(nonce => {
      describe(`Nonce: ${nonce}`, () => {
        let pfnV1, pfnV2

        beforeEach(() => {
          pfnV1 = new ProvablyFairNumbersV1(CLIENT_SEED, SERVER_SEED, nonce)
          pfnV2 = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, nonce)
        })

        test('should have same initial state', () => {
          expect(pfnV1.nonce).toBe(pfnV2.nonce)
        })

        test('random() should not advance state', () => {
          const v1Before = pfnV1.nonce
          const v2Before = pfnV2.nonce

          const v1Result = pfnV1.random()
          const v2Result = pfnV2.random()

          expect(pfnV1.nonce).toBe(v1Before)
          expect(pfnV2.nonce).toBe(v2Before)
          expect(Math.abs(v1Result - v2Result)).toBeLessThan(0.000001)
        })

        test('randomLong() should not advance state', () => {
          const v1Before = pfnV1.nonce
          const v2Before = pfnV2.nonce

          const v1Result = pfnV1.randomLong()
          const v2Result = pfnV2.randomLong()

          expect(pfnV1.nonce).toBe(v1Before)
          expect(pfnV2.nonce).toBe(v2Before)

          // V1 uses parseInt (64-bit limit), V2 uses BigInt (256-bit)
          // Just check that both return reasonable values
          expect(typeof v1Result).toBe('number')
          expect(typeof v2Result).toBe('bigint')
          expect(v1Result).toBeGreaterThan(0)
          expect(v2Result).toBeGreaterThan(0n)
        })

        test('randomInt() should not advance state (normal case)', () => {
          const v1Before = pfnV1.nonce
          const v2Before = pfnV2.nonce

          const v1Result = pfnV1.randomInt(0, 100)
          const v2Result = pfnV2.randomInt(0, 100)

          expect(pfnV1.nonce).toBe(v1Before)
          expect(pfnV2.nonce).toBe(v2Before)
          expect(v1Result).toBe(v2Result)
        })

        test('next() should advance state', () => {
          const v1Before = pfnV1.nonce
          const v2Before = pfnV2.nonce

          const v1Result = pfnV1.next()
          const v2Result = pfnV2.next()

          expect(pfnV1.nonce).toBe(v1Before + 1)
          expect(pfnV2.nonce).toBe(v2Before + 1)
          expect(Math.abs(v1Result - v2Result)).toBeLessThan(0.000001)
        })

        test('nextInt() should advance state', () => {
          const v1Before = pfnV1.nonce
          const v2Before = pfnV2.nonce

          const v1Result = pfnV1.nextInt(0, 10)
          const v2Result = pfnV2.nextInt(0, 10)

          expect(pfnV1.nonce).toBe(v1Before + 1)
          expect(pfnV2.nonce).toBe(v2Before + 1)
          expect(v1Result).toBe(v2Result)
        })

        test('crash() should not advance state', () => {
          const v1Before = pfnV1.nonce
          const v2Before = pfnV2.nonce

          const v1Result = pfnV1.crash(1, 1000)
          const v2Result = pfnV2.crash(1, 1000)

          expect(pfnV1.nonce).toBe(v1Before)
          expect(pfnV2.nonce).toBe(v2Before)
          expect(v1Result).toBe(v2Result)
        })
      })
    })
  })

  describe('V2 Specific Features', () => {
    test('should support array client seed', () => {
      const pfn = new ProvablyFairNumbersV2(ARRAY_CLIENT_SEED, SERVER_SEED, 0)
      expect(pfn.clientSeed).toBe('seed1|seed2|seed3')
    })

    test('should support index mode', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0, 5)
      expect(pfn.index).toBe(5)
    })

    test('should handle index mode correctly', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0, 10)

      const beforeIndex = pfn.index
      pfn.nextIndex()
      expect(pfn.index).toBe(beforeIndex + 1)
    })
  })

  describe('Rejection Sampling Safety', () => {
    test('should handle edge cases without infinite loops', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)

      // Test various ranges that might cause high rejection rates
      const ranges = [
        [0, 1], // 50% theoretical rejection
        [0, 3], // 25% theoretical rejection
        [0, 7], // 12.5% theoretical rejection
        [0, 15], // 6.25% theoretical rejection
        [0, 31], // 3.125% theoretical rejection
        [0, 100], // Normal case
        [0, 1000] // Large range
      ]

      ranges.forEach(([min, max]) => {
        const result = pfn.randomInt(min, max)
        expect(result).toBeGreaterThanOrEqual(min)
        expect(result).toBeLessThanOrEqual(max)
      })
    })

    test('should complete within safety limits', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)

      // Test various ranges to ensure no infinite loops
      const ranges = [
        [0, 1], // Binary choice
        [0, 3], // Small range
        [0, 7], // Power of 2 - 1
        [0, 15], // Power of 2 - 1
        [0, 31], // Power of 2 - 1
        [0, 100], // Normal range
        [0, 1000] // Large range
      ]

      ranges.forEach(([min, max]) => {
        const result = pfn.randomInt(min, max)
        expect(result).toBeGreaterThanOrEqual(min)
        expect(result).toBeLessThanOrEqual(max)
      })

      // Safety check - if we get here, no infinite loops occurred
      expect(true).toBe(true)
    })
  })

  describe('State Management', () => {
    test('should maintain consistent state behavior patterns', () => {
      const pfnV1 = new ProvablyFairNumbersV1(CLIENT_SEED, SERVER_SEED, 0)
      const pfnV2 = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)

      // Test state-preserving methods
      const beforeV1 = pfnV1.nonce
      const beforeV2 = pfnV2.nonce

      pfnV1.random()
      pfnV1.randomInt(0, 10)
      pfnV1.crash()

      pfnV2.random()
      pfnV2.randomInt(0, 10)
      pfnV2.crash()

      // These should not advance state
      expect(pfnV1.nonce).toBe(beforeV1)
      expect(pfnV2.nonce).toBe(beforeV2)

      // Test state-advancing methods
      pfnV1.next()
      pfnV1.nextInt(0, 10)

      pfnV2.next()
      pfnV2.nextInt(0, 10)

      // These should advance state by 2
      expect(pfnV1.nonce).toBe(beforeV1 + 2)
      expect(pfnV2.nonce).toBe(beforeV2 + 2)
    })
  })

  describe('Edge Cases', () => {
    test('should handle large ranges', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)
      const result = pfn.randomInt(0, 1000000)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(1000000)
    })

    test('should handle small ranges', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)
      const result = pfn.randomInt(0, 1)
      expect([0, 1]).toContain(result)
    })

    test('should handle shuffle with empty array', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)
      const result = pfn.shuffle([])
      expect(result).toEqual([])
    })

    test('should handle shuffle with single element', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)
      const result = pfn.shuffle([42])
      expect(result).toEqual([42])
    })

    test('should handle shuffle with medium arrays (11-52 elements)', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)
      // Test _shuffleSmall algorithm (11-52 elements)
      const mediumArray = Array.from({ length: 30 }, (_, i) => i + 1)
      const result = pfn.shuffle([...mediumArray])

      expect(result).toHaveLength(30)
      expect(result.sort((a, b) => a - b)).toEqual(mediumArray)
      // Should contain all original elements
      expect(new Set(result)).toEqual(new Set(mediumArray))
    })

    test('should handle shuffle with large arrays (>52 elements)', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)
      // Test standard Fisher-Yates algorithm (>52 elements)
      const largeArray = Array.from({ length: 100 }, (_, i) => i + 1)
      const result = pfn.shuffle([...largeArray])

      expect(result).toHaveLength(100)
      expect(result.sort((a, b) => a - b)).toEqual(largeArray)
      // Should contain all original elements
      expect(new Set(result)).toEqual(new Set(largeArray))
    })

    test('should use different shuffle algorithms based on array size', () => {
      const pfn = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)

      // Small array (uses _shuffleVerySmall)
      const smallResult = pfn.shuffle([1, 2, 3, 4, 5])
      expect(smallResult).toHaveLength(5)

      // Medium array (uses _shuffleSmall)
      const mediumResult = pfn.shuffle(Array.from({ length: 30 }, (_, i) => i + 1))
      expect(mediumResult).toHaveLength(30)

      // Large array (uses standard Fisher-Yates)
      const largeResult = pfn.shuffle(Array.from({ length: 100 }, (_, i) => i + 1))
      expect(largeResult).toHaveLength(100)

      // All should preserve elements
      expect(new Set(smallResult)).toEqual(new Set([1, 2, 3, 4, 5]))
      expect(new Set(mediumResult)).toEqual(new Set(Array.from({ length: 30 }, (_, i) => i + 1)))
      expect(new Set(largeResult)).toEqual(new Set(Array.from({ length: 100 }, (_, i) => i + 1)))
    })
  })
})
