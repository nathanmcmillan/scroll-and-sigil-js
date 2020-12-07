import {chartreuse} from 'color-name'

class Node {
  constructor(ch, freq, left = null, right = null) {
    this.ch = ch
    this.freq = freq
    this.left = left
    this.right = right
  }
}

class PriorityQueue {}

function priority(a, b) {
  return a.freq - b.freg
}

export function compress(src) {
  let map = new Map()
  let i = src.length
  while (i--) {
    let c = src[i]
    let f = map.get(c)
    if (f === undefined) f = 0
    map.set(c, f + 1)
  }
  let queue = new PriorityQueue()
  for (const [k, v] of map) queue.add(new Node(k, v))
  while (queue.size() != 1) {}
}

export function decompress(src, dest) {
  console.log(src, dest)
}
