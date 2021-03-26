import { intHashCode, Table, tableClear, TableIterator, tableIterHasNext, tableIterNext, tablePut } from '../collections/table.js'

const ITERATIONS = 80000

const numbers = new Float32Array(256)
for (let i = 0; i < 256; i++) numbers[i] = Math.random()

function loopOf() {
  const perf = performance.now()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    for (const value of numbers) sum += value * Math.random()
  }
  console.log(sum)
  console.log('time (of)', performance.now() - perf)
}

function loopIndex() {
  const perf = performance.now()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    for (let n = 0; n < numbers.length; n++) sum += numbers[n] * Math.random()
  }
  console.log(sum)
  console.log('time (index)', performance.now() - perf)
}

function randomInt(number) {
  return Math.floor(Math.random() * number)
}

function regularMap() {
  const perf = performance.now()
  const map = new Map()
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    map.clear()
    for (let n = 0; n < numbers.length; n++) map.set(randomInt(128), Math.random())
    for (const value of map.values()) sum += value
  }
  console.log(sum)
  console.log('time (map)', performance.now() - perf)
}

function customTable() {
  const perf = performance.now()
  const table = new Table(intHashCode)
  let sum = 0.0
  for (let i = 0; i < ITERATIONS; i++) {
    tableClear(table)
    for (let n = 0; n < numbers.length; n++) tablePut(table, randomInt(128), Math.random())
    const iter = new TableIterator(table)
    while (tableIterHasNext(iter)) sum += tableIterNext(iter).value
  }
  console.log(sum)
  console.log('time (table)', performance.now() - perf)
}

loopOf() // ~ 415 and 7,969,120 bytes
loopIndex() // ~ 72 and 0 bytes

// conclusion: for (const x of y) is terrible for performance and heap management

regularMap() // ~ 1,860 and 7,930,912 bytes
customTable() // ~ 1,223 and 118,90,368 bytes

// conclusion: custom map is faster but uses significantly more memory on insert
