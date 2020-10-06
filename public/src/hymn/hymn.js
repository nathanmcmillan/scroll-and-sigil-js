export const OP_ADD = 0
export const OP_SUBTRACT = 1
export const OP_MULTIPLY = 2
export const OP_DIVIDE = 3
export const OP_FUNCTION = 4
export const OP_IF = 5
export const OP_ELSE = 6
export const OP_ELIF = 7
export const OP_WHILE = 8
export const OP_END = 9
export const OP_CONTINUE = 10
export const OP_BREAK = 11

const RESERVED = new Set()
RESERVED.add('function')
RESERVED.add('if')
RESERVED.add('else')
RESERVED.add('elif')
RESERVED.add('end')
RESERVED.add('for')
RESERVED.add('while')
RESERVED.add('continue')
RESERVED.add('break')

export function parse(code) {
  let len = code.length
  let opcodes = []
  for (let i = 0; i < len; i++) {
    let c = code[i]
    console.log(c)
  }
  return opcodes
}

export function interpret(opcodes) {
  console.log(opcodes)
}
