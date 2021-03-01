export class Trigger {
  constructor(input) {
    this.event = null
    this.condition = null
    this.action = null
    const size = input.length
    let i = 0
    while (i < size) {
      if (input[i] === 'on') {
        i++
        this.event = input[i]
        i++
      } else if (input[i] === 'do') {
        i++
        let start = i
        this.action = input.splice(start, i)
        this.action = input[i]
        i++
      } else if (input[i] === 'condition') {
        i++
        this.condition = input[i]
        i++
      } else if (input[i] === 'end') break
      else i++
    }
    console.debug(this.event, this.condition, this.action)
  }

  export() {
    return this.event.join(' ') + this.condition.join(' ') + this.action.join(' ')
  }
}
