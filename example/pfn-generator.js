const fs = require('fs')

const { ProvablyFairNumbers } = require('../pfn')

// Config
const printOnlyNumbers = true
const saveToFile = true
const saveRawToFile = true
const count = Number(process.argv[2] || 10)

//
let fileStream
let fileStreamRaw

if (saveToFile) fileStream = fs.createWriteStream(`${Date.now()}.txt`, { flags: 'a' })
if (saveRawToFile) fileStreamRaw = fs.createWriteStream(`${Date.now()}_raw.txt`, { flags: 'a' })

//
for (let index = 0; index < count; index++) {
  console.time('pfn-' + index)
  //
  const size = 90
  const min = 1
  const max = 90

  //
  const line = []
  const lineRaw = []

  //
  const pfn = new ProvablyFairNumbers(String(index))
  if (!printOnlyNumbers) {
    line.push(pfn.clientSeed)
    line.push(pfn.serverSeed)
  }

  const intList = []
  const rawList = []
  while (intList.length < size) {
    const raw = pfn.random()
    const n = pfn.randomInt(min, max)
    //
    if (!(~intList.indexOf(n))) {
      intList.push(n)
      rawList.push(raw)
    }
    pfn.nonce++
  }
  line.push(intList.join(' '))
  lineRaw.push(rawList.join(' '))

  //
  const lineText = '\n' + line.join(' ')
  if (saveToFile) fileStream.write(lineText)
  else console.log(lineText)

  //
  const rawLineText = '\n' + lineRaw.join(' ')
  if (saveRawToFile) fileStreamRaw.write(rawLineText)
  else console.log(rawLineText)

  console.timeEnd('pfn-' + index)
}
