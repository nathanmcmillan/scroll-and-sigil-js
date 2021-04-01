export function flagExport(flag) {
  return flag.id
}

function flagNumber(id) {
  switch (id) {
    case 'water':
      return 1
    case 'lava':
      return 2
    default:
      return 0
  }
}

export class Flag {
  constructor(input) {
    this.id = null
    this.number = 0
    this.values = null
    const size = input.length
    if (size === 0) return
    this.id = input[0]
    this.number = flagNumber(this.id)
    let i = 1
    if (input[i] === 'water') i++
    else if (input[i] === 'lava') i += 2
    if (i > 1) {
      if (i >= size) throw 'Parsed bad trigger'
      this.values = input.slice(1, i)
    }
  }
}

export class Flags {
  constructor(input) {
    this.flags = []
  }
}
