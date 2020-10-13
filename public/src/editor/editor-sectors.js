import {Sector, sectorInsideOutside} from '/src/map/sector.js'
import {WORLD_SCALE} from '/src/world/world.js'
import {sectorTriangulate} from '/src/map/triangulate.js'

function copy(src, dest) {
  dest.bottom = src.bottom
  dest.floor = src.floor
  dest.ceiling = src.ceiling
  dest.top = src.top
  dest.floor_texture = src.floor_texture
  dest.ceiling_texture = src.ceiling_texture
}

function match(src, dest) {
  if (src.lines.length !== dest.lines.length) return false
  for (let a of src.lines) {
    let found = false
    for (let b of dest.lines) {
      if (a === b) {
        found = true
        break
      }
    }
    if (!found) return false
  }
  return true
}

function transfer(previous, sectors) {
  for (const sector of sectors) {
    let i = previous.length
    while (i--) {
      let old = previous[i]
      if (match(old, sector)) {
        copy(old, sector)
        previous.splice(i, 1)
        console.log('match', old)
        break
      }
    }
  }
}

function unused(sectors, check) {
  for (const sector of sectors) {
    for (const line of sector.lines) {
      if (check === line) return false
    }
  }
  return true
}

function range(angle) {
  while (angle >= 360.0) angle -= 360.0
  while (angle < 0.0) angle += 360.0
  return angle
}

function swap(lines) {
  for (const line of lines) {
    let left = null
    let right = null
    let start = null
    let end = null
    for (const other of lines) {
      if (other === line) continue
      if (line.a == other.a) start = other
      if (line.a == other.b) left = other
      if (line.b == other.b) end = other
      if (line.b == other.a) right = other
    }
    if (left !== null && right !== null) continue
    if (left === null && right !== null) continue
    if (left === null && start === null) continue
    if (right === null && end === null) continue
    let temp = line.a
    line.a = line.b
    line.b = temp
  }
}

function reorder(vecs) {
  let sum = 0.0
  let len = vecs.length
  for (let i = 0; i < len; i++) {
    let k = i + 1 == len ? 0 : i + 1
    sum += (vecs[k].x - vecs[i].x) * (vecs[k].y + vecs[i].y)
  }
  if (sum >= 0.0) return
  let temp = vecs[0]
  vecs[0] = vecs[1]
  vecs[1] = temp
  let i = 2
  while (true) {
    if (i >= len - i + 1) {
      break
    }
    temp = vecs[i]
    vecs[i] = vecs[len - i + 1]
    vecs[len - i + 1] = temp
    i++
  }
}

function construct(editor, sectors, start) {
  let first = start
  let clockwise = true
  let vecs = [start.a]
  let lines = [start]
  while (true) {
    let second = null
    let secondAngle = Number.MAX_VALUE
    let clockChange = false
    for (const line of editor.lines) {
      if (line === first) continue
      if (line.a !== first.a && line.b !== first.a && line.a !== first.b && line.b !== first.b) continue
      let angle = Math.atan2(line.a.y - line.b.y, line.a.x - line.b.x) - Math.atan2(first.a.y - first.b.y, first.a.x - first.b.x)
      angle = (180.0 * angle) / Math.PI
      if (clockwise) {
        if (first.b === line.a) {
          angle = range(angle + 180.0)
          if (angle < secondAngle) {
            second = line
            secondAngle = angle
            clockChange = false
          }
        } else if (first.b === line.b) {
          angle = range(angle)
          if (angle < secondAngle) {
            second = line
            secondAngle = angle
            clockChange = true
          }
        }
      } else {
        if (first.a === line.b) {
          angle = range(angle + 180.0)
          if (angle < secondAngle) {
            second = line
            secondAngle = angle
            clockChange = false
          }
        } else if (first.a === line.a) {
          angle = range(angle)
          if (angle < secondAngle) {
            second = line
            secondAngle = angle
            clockChange = true
          }
        }
      }
    }
    if (second === null || start === second) break
    if (clockChange) clockwise = !clockwise
    if (clockwise) vecs.push(second.a)
    else vecs.push(second.b)
    lines.push(second)
    first = second
  }
  return [vecs, lines]
}

export function computeSectors(editor) {
  console.log('----------')
  for (const sector of editor.sectors) {
    console.log('original sector:', sector)
  }

  // TODO does this do anything?
  swap(editor.lines)

  // TODO not all sectors are correctly regenerated
  let sectors = []
  for (const line of editor.lines) {
    if (!unused(sectors, line)) continue
    let [vecs, lines] = construct(editor, sectors, line)
    if (lines.length < 3) continue
    reorder(vecs)
    sectors.push(new Sector(0.0, 0.0, 5.0, 6.0, -1, -1, vecs, lines))
  }

  transfer(editor.sectors, sectors)
  sectorInsideOutside(sectors)
  for (const sector of sectors) {
    // TODO triangulate should ignore floor / ceil texture skipping for editing purposes
    sectorTriangulate(sector, WORLD_SCALE)
    console.log('sector:', sector)
  }

  editor.sectors = sectors
}
