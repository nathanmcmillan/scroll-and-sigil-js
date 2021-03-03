export class Trigger {
  constructor(input) {
    this.event = null
    this.action = null
    this.condition = null
    const size = input.length
    let i = 0
    while (i < size) {
      if (input[i] === 'on') {
        i++
        const s = i
        if (input[s] === 'every') i += 3
        else i++
        this.event = input.slice(s, i)
      } else if (input[i] === 'do') {
        i++
        const s = i
        if (input[s] === 'goto') i += 3
        else if (input[s] === 'teleport') i += 3
        else if (input[s] === 'spawn') i += 4
        else i++
        this.action = input.slice(s, i)
      } else if (input[i] === 'if') {
        i++
        const s = i
        if (input[s] === 'lte') i += 3
        else i++
        this.condition = input.slice(s, i)
      } else if (input[i] === 'end') break
      else i++
    }
  }

  export() {
    return this.event.join(' ') + ' ' + this.action.join(' ') + (this.condition ? ' ' + this.condition.join(' ') : '')
  }
}
