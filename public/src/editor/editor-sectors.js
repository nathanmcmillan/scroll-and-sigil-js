import {WORLD_SCALE} from '/src/world/world.js'
import {sectorInsideOutside} from '/src/map/sector.js'
import {sectorTriangulateForEditor} from '/src/map/triangulate.js'
import {SectorReference} from '/src/editor/editor-references.js'

function vecCompare(a, b) {
  if (a.y > b.y) return -1
  if (a.y < b.y) return 1
  if (a.x > b.x) return 1
  if (a.x < b.x) return -1
  return 0
}

function copy(src, dest) {
  dest.bottom = src.bottom
  dest.floor = src.floor
  dest.ceiling = src.ceiling
  dest.top = src.top
  dest.floor_texture = src.floor_texture
  dest.ceiling_texture = src.ceiling_texture
}

function match(src, dest) {
  if (src.vecs.length !== dest.vecs.length) return false
  for (let a of src.vecs) {
    if (dest.vecs.indexOf(a) === -1) return false
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
        break
      }
    }
  }
}

function duplicate(sectors, vecs) {
  for (const sector of sectors) {
    if (vecs.length !== sector.vecs.length) continue
    let duplicate = true
    for (const s of sector.vecs) {
      if (vecs.indexOf(s) == -1) {
        duplicate = false
        break
      }
    }
    if (duplicate) {
      console.warn('duplicate computed sector')
      return true
    }
  }
  return false
}

function interior(a, b, c) {
  let angle = Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b.y - c.y, b.x - c.x)
  angle = (180.0 * angle) / Math.PI
  if (angle < 0.0) angle += 360.0
  else if (angle >= 360.0) angle -= 360.0
  return angle
}

function mark(lines, all) {
  for (const line of lines) {
    let b = line.b
    let count = 0
    for (const other of all) {
      if (other === line) continue
      if (other.has(b)) count++
    }
    if (count === 1) line.done = true
  }
}

function reorder(vecs) {
  let sum = 0.0
  let len = vecs.length
  for (let i = 0; i < len; i++) {
    let k = i + 1 == len ? 0 : i + 1
    sum += (vecs[k].x - vecs[i].x) * (vecs[k].y + vecs[i].y)
  }
  if (sum >= 0.0) {
    console.warn('not re-ordering polygon vectors')
    return
  }
  let temp = vecs[0]
  vecs[0] = vecs[1]
  vecs[1] = temp
  let i = 2
  while (i < len - i + 1) {
    temp = vecs[i]
    vecs[i] = vecs[len - i + 1]
    vecs[len - i + 1] = temp
    i++
  }
}

function construct(editor, sectors, start) {
  let a = start.a
  let b = start.b
  let vecs = [a, b]
  let lines = [start]
  let origin = a
  let initial = true
  while (true) {
    let second = null
    let next = null
    let best = Number.MAX_VALUE
    let reverse = false
    for (const line of editor.lines) {
      if (line === start) continue
      if (!line.has(b)) continue
      let c = line.other(b)
      let angle = interior(a, b, c)
      let wind = false
      if (initial && angle >= 180.0) {
        angle = interior(c, b, a)
        wind = true
        console.log('reversed interior', angle, 'of', a, b, c)
      } else {
        console.log('interior', angle, 'of', a, b, c)
      }
      if (angle < best) {
        second = line
        next = c
        best = angle
        reverse = wind
      }
    }
    if (second === null) {
      console.log('return (not found)')
      return [null, null]
    }
    if (initial) {
      if (reverse) {
        a = next
        origin = a
        vecs[0] = a
        next = start.a
        lines[0] = second
        second = start
        start = lines[0]
        console.log('(reversed)')
      }
      initial = false
      console.log('a', a.x, a.y)
      console.log('b', b.x, b.y)
    }
    console.log('c', next.x, next.y)
    if (next === origin) {
      console.log('return (good)')
      lines.push(second)
      return [vecs, lines]
    }
    if (vecs.indexOf(next) >= 0) {
      console.log('return (bad)')
      return [null, null]
    }
    vecs.push(next)
    lines.push(second)
    a = b
    b = next
    start = second
  }
}

export function computeSectors(editor) {
  console.log('--- begin compute sectors ---')

  editor.vecs.sort(vecCompare)
  for (const line of editor.lines) line.done = false

  let sectors = []
  for (const line of editor.lines) {
    if (line.done) continue
    let [vecs, lines] = construct(editor, sectors, line)
    if (vecs === null || lines.length < 3) continue
    if (duplicate(sectors, vecs)) continue
    reorder(vecs)
    mark(lines, editor.lines)
    console.log('sector:')
    for (const vec of vecs) {
      console.log(' ', vec.x, vec.y)
    }
    console.log('----------')
    sectors.push(new SectorReference(0.0, 0.0, 5.0, 6.0, -1, -1, vecs, lines))
  }

  transfer(editor.sectors, sectors)
  sectorInsideOutside(sectors)

  console.log('==========')
  for (const sector of sectors) {
    try {
      sectorTriangulateForEditor(sector, WORLD_SCALE)
    } catch (e) {
      console.error(e)
    }
    console.log('----------')
  }

  editor.sectors = sectors
  console.log('--- end compute sectors', sectors.length, '---')
}
