const LOAD_FACTOR = 0.8
const INITIAL_BINS = 1 << 3
const MAXIMUM_BINS = 1 << 30

class TableItem {
  constructor(hash, key, value) {
    this.hash = hash
    this.key = key
    this.value = value
    this.next = null
  }
}

// TODO: Keep a TableItem pool for re-using after remove() and clear() operations

export class Table {
  constructor(hashfunc) {
    this.size = 0
    this.bins = INITIAL_BINS
    this.items = new Array(this.bins).fill(null)
    this.hashfunc = hashfunc
  }
}

export function intHashCode(key) {
  return key
}

export function strHashCode(key) {
  const len = key.length
  let hash = 0
  for (let i = 0; i < len; i++) {
    hash = 31 * hash + key.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function getBin(table, hash) {
  return (table.bins - 1) & hash
}

function mix(hash) {
  return hash ^ (hash >> 16)
}

function resize(table) {
  const binsOld = table.bins
  const bins = binsOld << 1

  if (bins > MAXIMUM_BINS) return

  const itemsOld = table.items
  const items = new Array(bins).fill(null)
  for (let i = 0; i < binsOld; i++) {
    let item = itemsOld[i]
    if (item === null) continue
    if (item.next === null) {
      items[(bins - 1) & item.hash] = item
    } else {
      let lowHead = null
      let lowTail = null
      let highHead = null
      let highTail = null
      do {
        if ((binsOld & item.hash) === 0) {
          if (lowTail === null) lowHead = item
          else lowTail.next = item
          lowTail = item
        } else {
          if (highTail === null) highHead = item
          else highTail.next = item
          highTail = item
        }
        item = item.next
      } while (item !== null)

      if (lowTail !== null) {
        lowTail.next = null
        items[i] = lowHead
      }

      if (highTail !== null) {
        highTail.next = null
        items[i + binsOld] = highHead
      }
    }
  }

  table.bins = bins
  table.items = items
}

export function tablePut(table, key, value) {
  const hash = mix(table.hashfunc(key))
  const bin = getBin(table, hash)
  let item = table.items[bin]
  let previous = null
  while (item !== null) {
    if (hash === item.hash && key === item.key) {
      item.value = value
      return
    }
    previous = item
    item = item.next
  }
  item = new TableItem(hash, key, value)
  if (previous === null) table.items[bin] = item
  else previous.next = item
  table.size++
  if (table.size > table.bins * LOAD_FACTOR) resize(table)
}

export function tableGet(table, key) {
  const hash = mix(table.hashfunc(key))
  const bin = getBin(table, hash)
  let item = table.items[bin]
  while (item !== null) {
    if (hash === item.hash && key === item.key) return item.value
    item = item.next
  }
  return null
}

export function tableHas(table, key) {
  return tableGet(table, key) !== null
}

export function tableRemove(table, key) {
  const hash = mix(table.hashfunc(key))
  const bin = getBin(table, hash)
  let item = table.items[bin]
  let previous = null
  while (item !== null) {
    if (hash === item.hash && key === item.key) {
      if (previous === null) table.items[bin] = item.next
      else previous.next = item.next
      table.size--
      return item.value
    }
    previous = item
    item = item.next
  }
  return null
}

export function tableClear(table) {
  const bins = table.bins
  for (let i = 0; i < bins; i++) {
    let item = table.items[i]
    while (item !== null) {
      const next = item.next
      item.next = null
      item = next
    }
    table.items[i] = null
  }
  table.size = 0
}

export function tableIsEmpty(table) {
  return table.size === 0
}

export function tableNotEmpty(table) {
  return table.size !== 0
}

export function tableSize(table) {
  return table.size
}

export class TableIterator {
  constructor(table) {
    this.pointer = table
    this.bin = 0
    this.item = null
    if (table.size !== 0) {
      const bins = table.bins
      for (let i = 0; i < bins; i++) {
        const start = table.items[i]
        if (start !== null) {
          this.bin = i
          this.item = start
          break
        }
      }
    }
  }
}

export function tableIterHasNext(iter) {
  return iter.item !== null
}

export function tableIterNext(iter) {
  let item = iter.item
  if (item === null) return null
  const result = item
  item = item.next
  if (item === null) {
    let bin = iter.bin + 1
    const stop = iter.pointer.bins
    while (bin < stop) {
      const start = iter.pointer.items[bin]
      if (start !== null) {
        item = start
        break
      }
      bin++
    }
    iter.bin = bin
  }
  iter.item = item
  return result
}
