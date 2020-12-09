class Reader {
  constructor(src) {
    this.src = src
    this.pos = 0
  }

  bool() {
    let src = this.src
    let pos = this.pos
    if (pos >= src.length) throw 'Reader out of bounds: ' + pos
    let value = src[pos]
    this.pos = pos + 1
    console.log('bool', value, '=>', value === '1')
    return value === '1'
  }

  char() {
    let src = this.src
    let pos = this.pos
    if (this.pos + 8 >= this.src.length) throw 'Reader out of bounds: ' + pos
    let value = ''
    for (let i = 0; i < 8; i++) value += src[pos + i]
    this.pos = pos + 8
    console.log('char', value, '=>', parseInt(value, 2), '=>', String.fromCharCode(parseInt(value, 2)))
    return String.fromCharCode(parseInt(value, 2))
  }

  int() {
    let src = this.src
    let pos = this.pos
    if (this.pos + 32 >= this.src.length) throw 'Reader out of bounds: ' + pos
    let value = ''
    for (let i = 0; i < 32; i++) value += src[pos + i]
    this.pos = pos + 32
    console.log('int', value, '=>', parseInt(value, 2))
    return parseInt(value, 2)
  }
}

class Node {
  constructor(ch, freq, left = null, right = null) {
    this.ch = ch
    this.freq = freq
    this.left = left
    this.right = right
  }

  leaf() {
    return this.left === null && this.right === null
  }
}

class Queue {
  constructor() {
    this.items = []
  }

  add(item) {
    let items = this.items
    let len = items.length
    for (let i = 0; i < len; i++) {
      if (item.freq < items[i].freq) {
        items.splice(i, 0, item)
        return
      }
    }
    items.push(item)
  }

  dequeue() {
    return this.items.shift()
  }

  size() {
    return this.items.length
  }
}

function char8(ch) {
  ch = ch.charCodeAt(0)
  let out = ch.toString(2)
  while (out.length < 8) out = '0' + out
  return out
}

function int32(int) {
  let out = int.toString(2)
  while (out.length < 32) out = '0' + out
  return out
}

function write(node) {
  let out = ''
  if (node.leaf()) {
    out += '1'
    out += char8(node.ch)
    return out
  }
  out += '0'
  out += write(node.left)
  out += write(node.right)
  return out
}

function code(lookup, node, str) {
  if (node.leaf()) {
    lookup.set(node.ch, str)
  } else {
    code(lookup, node.left, str + '0')
    code(lookup, node.right, str + '1')
  }
}

export function compress(src) {
  let len = src.length
  console.log('len', len)
  if (len < 1) return null
  let map = new Map()
  let i = len
  while (i--) {
    let c = src[i]
    let f = map.get(c)
    if (f === undefined) f = 0
    map.set(c, f + 1)
  }
  let queue = new Queue()
  for (const [k, v] of map) queue.add(new Node(k, v))
  while (queue.size() > 1) {
    let a = queue.dequeue()
    let b = queue.dequeue()
    queue.add(new Node('\0', a.freq + b.freq, a, b))
  }
  let tree = queue.dequeue()
  let lookup = new Map()
  code(lookup, tree, '')
  for (const [k, v] of lookup) console.log('ch', k, '=>', v)
  let out = write(tree)
  out += int32(len)
  for (let i = 0; i < len; i++) out += lookup.get(src[i])
  return out
}

function read(reader) {
  if (reader.bool()) return new Node(reader.char(), -1)
  return new Node('\0', -1, read(reader), read(reader))
}

export function decompress(src) {
  let reader = new Reader(src)
  let node = read(reader)
  console.log('tree', node)
  let len = reader.int()
  let out = ''
  for (let i = 0; i < len; i++) {
    while (!node.leaf()) {
      let bool = reader.bool()
      if (bool) node = node.right
      else node = node.left
    }
    out += node.ch
  }
  return out
}
