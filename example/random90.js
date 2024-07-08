const { ProvablyFairNumbers } = require('./pfn')

//
;(() => {
  //
  const clientSeed = Date.now()
  const pfn = new ProvablyFairNumbers(clientSeed)
  console.log(pfn)

  const random90 = pfn.randomIntRange(1, 90, 90, true)
  console.log(random90)

  console.log(pfn)
  //
})()
