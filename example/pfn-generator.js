const fs = require('fs')

const { ProvablyFairNumbers } = require('../pfn')

// Config
const saveToFile = true
const count = 10

//
const fileStream = saveToFile ? fs.createWriteStream(`${Date.now()}.txt`, {
  flags: 'a'
}) : null

for (let index = 0; index < count; index++) {
  console.time('pfn-' + index)
  const line = []
  //
  const pfn = new ProvablyFairNumbers(String(index))
  line.push(pfn.clientSeed)
  line.push(pfn.serverSeed)
  const r = pfn.randomIntRange(1, 90, 90, true)
  line.push(r.u.join(' '))

  //
  const lineText = '\n' + line.join(' ')

  if (saveToFile) fileStream.write(lineText)
  else console.log(lineText)

  console.timeEnd('pfn-' + index)
}
