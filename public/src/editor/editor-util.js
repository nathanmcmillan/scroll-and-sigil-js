export function referenceLinesFromVec(vec, lines) {
  let list = []
  for (const line of lines) {
    if (line.has(vec)) {
      list.push(line)
    }
  }
  return list
}
