export function darkblue(i) {
  if (i === 0) return 29
  if (i === 1) return 43
  return 83
}

export function darkbluef(i) {
  return darkblue(i) / 255.0
}

export function red(i) {
  if (i === 0) return 255
  if (i === 1) return 0
  return 77
}

export function redf(i) {
  return red(i) / 255.0
}

export function white(i) {
  if (i === 0) return 255
  if (i === 1) return 241
  return 232
}

export function whitef(i) {
  return white(i) / 255.0
}
