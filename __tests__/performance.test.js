const { ProvablyFairNumbers, ProvablyFairNumbersV2 } = require('../index.js')

// Test configuration
const CLIENT_SEED = 'test-client-seed'
const SERVER_SEED = 'test-server-seed-1234567890abcdef'
const ITERATIONS = 10000

// Test function
function runTest (name, pfnClass, testFn) {
  console.log(`\n--- ${name} ---`)

  const start = process.hrtime.bigint()
  const result = testFn()
  const end = process.hrtime.bigint()

  const timeMs = Number(end - start) / 1_000_000
  console.log(`Time: ${timeMs.toFixed(2)}ms`)
  console.log('Result:', result)

  return { time: timeMs, result }
}

describe('Performance Comparison: V1 vs V2', () => {
  test('should show basic functionality works for both versions', () => {
    // V1 Tests
    const pfn1 = new ProvablyFairNumbers(CLIENT_SEED, SERVER_SEED)
    const v1Random = pfn1.random().toFixed(6)
    const v1RandomInt = pfn1.randomInt(0, 10)
    const v1Crash = pfn1.crash(1, 100)

    console.log('V1 Basic random():', v1Random)
    console.log('V1 Basic randomInt(0, 10):', v1RandomInt)
    console.log('V1 Basic crash():', v1Crash)

    // V2 Tests
    const pfn2 = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED)
    const v2Random = pfn2.random().toFixed(6)
    const v2RandomInt = pfn2.randomInt(0, 10)
    const v2Crash = pfn2.crash(1, 100)

    console.log('V2 Basic random():', v2Random)
    console.log('V2 Basic randomInt(0, 10):', v2RandomInt)
    console.log('V2 Basic crash():', v2Crash)

    // Verify both work
    expect(typeof v1Random).toBe('string')
    expect(typeof v2Random).toBe('string')
    expect(v1RandomInt).toBeGreaterThanOrEqual(0)
    expect(v1RandomInt).toBeLessThanOrEqual(10)
    expect(v2RandomInt).toBeGreaterThanOrEqual(0)
    expect(v2RandomInt).toBeLessThanOrEqual(10)
  })

  test('should maintain deterministic behavior', () => {
    const pfn1det = new ProvablyFairNumbers(CLIENT_SEED, SERVER_SEED, 0)
    const pfn2det = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)

    const seq1 = []
    const seq2 = []

    for (let i = 0; i < 10; i++) {
      seq1.push(pfn1det.random())
      seq2.push(pfn2det.random())
    }

    console.log('V1 Sequence (first 5):', seq1.slice(0, 5).map(v => v.toFixed(6)))
    console.log('V2 Sequence (first 5):', seq2.slice(0, 5).map(v => v.toFixed(6)))

    // Each version should be internally consistent
    expect(seq1.length).toBe(10)
    expect(seq2.length).toBe(10)

    // Test same seeds produce same sequence for each version
    const pfn1det2 = new ProvablyFairNumbers(CLIENT_SEED, SERVER_SEED, 0)
    const seq1Again = []
    for (let i = 0; i < 10; i++) {
      seq1Again.push(pfn1det2.random())
    }
    expect(seq1).toEqual(seq1Again)

    const pfn2det2 = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED, 0)
    const seq2Again = []
    for (let i = 0; i < 10; i++) {
      seq2Again.push(pfn2det2.random())
    }
    expect(seq2).toEqual(seq2Again)
  })

  test('should compare sequential operations performance', () => {
    // Sequential operations (V2 should be faster)
    const pfn1Seq = new ProvablyFairNumbers(CLIENT_SEED, SERVER_SEED)
    const result1seq = runTest('V1 Sequential (10000 calls)', ProvablyFairNumbers, () => {
      const results = []
      for (let i = 0; i < ITERATIONS; i++) {
        results.push(pfn1Seq.next())
      }
      return `Generated ${results.length} numbers, last: ${results[results.length - 1].toFixed(6)}`
    })

    const pfn2Seq = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED)
    const result2seq = runTest('V2 Sequential (10000 calls)', ProvablyFairNumbersV2, () => {
      const results = []
      for (let i = 0; i < ITERATIONS; i++) {
        results.push(pfn2Seq.next())
      }
      return `Generated ${results.length} numbers, last: ${results[results.length - 1].toFixed(6)}`
    })

    // Summary
    const seqImprovement = ((result1seq.time - result2seq.time) / result1seq.time * 100).toFixed(1)
    console.log(`Sequential operations improvement: ${seqImprovement}% faster`)

    // V2 should be reasonably competitive (within 2x performance)
    expect(result2seq.time).toBeLessThan(result1seq.time * 2)
    console.log(`V2 performance is ${((result1seq.time / result2seq.time) * 100).toFixed(1)}% of V1 speed`)
  })

  test('should compare shuffle operations performance', () => {
    const testArray = Array.from({ length: 52 }, (_, i) => i + 1)

    const result1Shuffle = runTest('V1 Shuffle (100 times)', ProvablyFairNumbers, () => {
      const results = []
      for (let i = 0; i < 100; i++) {
        const instance = new ProvablyFairNumbers(CLIENT_SEED, SERVER_SEED)
        results.push(instance.shuffle([...testArray]))
      }
      return `Last shuffle first 5: ${results[results.length - 1].slice(0, 5)}`
    })

    const result2Shuffle = runTest('V2 Shuffle (100 times)', ProvablyFairNumbersV2, () => {
      const results = []
      for (let i = 0; i < 100; i++) {
        const instance = new ProvablyFairNumbersV2(CLIENT_SEED, SERVER_SEED)
        results.push(instance.shuffle([...testArray]))
      }
      return `Last shuffle first 5: ${results[results.length - 1].slice(0, 5)}`
    })

    // Summary
    const shuffleImprovement = ((result1Shuffle.time - result2Shuffle.time) / result1Shuffle.time * 100).toFixed(1)
    console.log(`Shuffle operations improvement: ${shuffleImprovement}% faster`)

    // Both should work and produce valid results
    expect(result1Shuffle.result).toContain('Last shuffle first 5:')
    expect(result2Shuffle.result).toContain('Last shuffle first 5:')
  })

  test('should verify exports work correctly', () => {
    const exports = require('../index.js')
    const availableExports = Object.keys(exports)

    console.log('Available exports:', availableExports)

    // Test both versions are accessible
    const V1 = exports.ProvablyFairNumbers
    const V2 = exports.ProvablyFairNumbersV2

    expect(typeof V1).toBe('function')
    expect(typeof V2).toBe('function')

    // Test they can be instantiated
    const v1Instance = new V1('test', 'seed')
    const v2Instance = new V2('test', 'seed')

    expect(v1Instance).toBeInstanceOf(V1)
    expect(v2Instance).toBeInstanceOf(V2)

    console.log('Both classes exported successfully! ✅')
  })
})
