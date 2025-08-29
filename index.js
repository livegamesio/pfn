/**
 * Provably Fair Numbers - Combined Export
 *
 * This module exports both versions:
 * - ProvablyFairNumbers: Original implementation (V1)
 * - ProvablyFairNumbersV2: Performance optimized (V2)
 *
 * @copyright LiveGames 2025
 */

// Import both versions
const { ProvablyFairNumbers } = require('./pfn.js')
const { ProvablyFairNumbersV2 } = require('./pfn-v2.js')

// Export both versions
module.exports = {
  ProvablyFairNumbers: ProvablyFairNumbersV2, // V2 is the default
  ProvablyFairNumbersV1: ProvablyFairNumbers, // V1 original
  ProvablyFairNumbersV2 // V2 explicit
}
