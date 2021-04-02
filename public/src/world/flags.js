export const FLAG_WATER = 1
export const FLAG_LAVA = 2
export const FLAG_BOSS = 3
export const FLAG_PHYSICAL = 4
export const FLAG_NOT_PHYSICAL = 5

function flagNumber(id) {
  switch (id) {
    case 'water':
      return FLAG_WATER
    case 'lava':
      return FLAG_LAVA
    case 'boss':
      return FLAG_BOSS
    case 'physical':
      return FLAG_PHYSICAL
    case 'not-physical':
      return FLAG_NOT_PHYSICAL
    default:
      return 0
  }
}

class Flag {
  constructor(id, values) {
    this.id = id
    this.number = flagNumber(id)
    this.values = values
    console.debug('flag parsed:', this.id, this.number, this.values)
  }
}

export function flagsExport(flags) {
  let content = ''
  for (let f = 0; f < flags.flags.length; f++) {
    const flag = flags[f]
    if (content !== '') content += ' '
    content += flag.id
    if (flag.values) content += flag.values.join(' ')
  }
  console.debug('export flags:', content)
  return content
}

export class Flags {
  constructor(input) {
    this.flags = []
    let i = 0
    const size = input.length
    while (i < size) {
      const id = input[i]
      i++
      const s = i
      if (id === 'water') i++
      else if (id === 'lava') i += 2
      if (i > size) throw 'Parsed bad flag: ' + input
      let values = null
      if (i > s) values = input.slice(s, i)
      if (id === 'water') {
        values[0] = parseInt(values[0])
      } else if (id === 'lava') {
        values[0] = parseInt(values[0])
        values[1] = parseInt(values[1])
      }
      this.flags.push(new Flag(id, values))
      i++
    }
  }

  includes(number) {
    const flags = this.flags
    for (let f = 0; f < flags.length; f++) if (flags[f].number === number) return flags[f]
    return null
  }
}
