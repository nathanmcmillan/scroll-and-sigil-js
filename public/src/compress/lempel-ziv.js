class Bits {
  constructor(src) {
    this.src = src
    this.pos = 0
    this.mask = 0x01
  }

  get1() {
    let r = (this.src[this.pos] & this.mask) != 0
    this.mask <<= 1
    if (!this.mask) {
      this.mask = 1
      this.pos++
    }
    return r
  }

  getn(n) {
    let r = 0
    while (n--) {
      r <<= 1
      r |= this.get1()
    }
    return r
  }
}

export function decompress(src, dest) {
  let bits = new Bits(src)
  let o = bits.getn(4)
  let l = bits.getn(4)
  let m = bits.getn(2)
  let end = bits.getn(16)
  let pos = 0
  while (pos < end) {
    if (bits.get1() == 0) {
      dest[pos] = bits.getn(8)
      pos++
    } else {
      let offset = -bits.getn(o) - 1
      let length = bits.getn(l) + m
      while (length--) {
        dest[pos] = dest[pos + offset]
        pos++
      }
    }
  }
}
