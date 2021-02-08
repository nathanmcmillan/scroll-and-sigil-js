import {lineNullSectors} from '../map/line.js'
import {WORLD_SCALE} from '../world/world.js'
import {sectorLineNeighbors, sectorInsideOutside} from '../map/sector.js'
import {sectorTriangulateForEditor} from '../map/triangulate.js'
import {SectorReference} from '../editor/map-edit-references.js'

const debug = false

function copy(src, dest) {
  dest.bottom = src.bottom
  dest.floor = src.floor
  dest.ceiling = src.ceiling
  dest.top = src.top
  dest.floorTexture = src.floorTexture
  dest.ceilingTexture = src.ceilingTexture
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

function vecCompare(a, b) {
  if (a.y > b.y) return -1
  if (a.y < b.y) return 1
  if (a.x > b.x) return 1
  if (a.x < b.x) return -1
  return 0
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

function clockwiseReflex(a, b, c) {
  return (b.x - c.x) * (a.y - b.y) - (a.x - b.x) * (b.y - c.y) > 0.0
}

function clockwiseInterior(a, b, c) {
  let angle = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

// function swap(lines) {
//   for (const line of lines) {
//     let left = null
//     let right = null
//     let start = null
//     let end = null
//     for (const other of lines) {
//       if (other === line) continue
//       if (line.a == other.a) start = other
//       if (line.a == other.b) left = other
//       if (line.b == other.b) end = other
//       if (line.b == other.a) right = other
//     }
//     if (left !== null && right !== null) continue
//     if (left === null && right !== null) continue
//     if (left === null && start === null) continue
//     if (right === null && end === null) continue
//     let temp = line.a
//     line.a = line.b
//     line.b = temp
//   }
// }

function clockwise(vecs) {
  let sum = 0.0
  let len = vecs.length
  for (let i = 0; i < len; i++) {
    let k = i + 1 == len ? 0 : i + 1
    sum += (vecs[k].x - vecs[i].x) * (vecs[k].y + vecs[i].y)
  }
  if (sum >= 0.0) return true
  console.warn('re-ordering polygon to turn clockwise')
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
  return false
}

function topVec(previous, vec) {
  return previous.y < vec.y
}

function topOfSector(previous, vec, next) {
  return next.y <= vec.y && clockwiseReflex(previous, vec, next)
}

function construct(editor, sectors, start) {
  let a = start.a
  let b = start.b
  if (!topVec(a, b)) {
    a = start.b
    b = start.a
  }
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
      if (initial && !topOfSector(a, b, c)) continue
      let angle = clockwiseInterior(a, b, c)
      if (debug) console.debug('reflex', clockwiseReflex(a, b, c), angle)
      let wind = false
      if (initial && angle >= Math.PI) {
        angle = clockwiseInterior(c, b, a)
        wind = true
        if (debug) console.debug('reversed interior', angle, 'of', a, b, c)
      } else {
        if (debug) console.debug('interior', angle, 'of', a, b, c)
      }
      if (angle < best) {
        second = line
        next = c
        best = angle
        reverse = wind
      }
    }
    if (second === null) {
      if (debug) console.debug('return (not found)')
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
        if (debug) console.debug('(reversed)')
      }
      initial = false
      if (debug) console.debug('a', a.x, a.y)
      if (debug) console.debug('b', b.x, b.y)
    }
    if (debug) console.debug('c', next.x, next.y)
    if (next === origin) {
      if (debug) console.debug('return (good)')
      lines.push(second)
      return [vecs, lines]
    }
    if (vecs.indexOf(next) >= 0) {
      if (debug) console.debug('return (bad)')
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
  if (debug) console.debug('^ start compute sectors ---')

  editor.vecs.sort(vecCompare)

  let sectors = []
  for (const line of editor.lines) {
    if (debug) console.debug('@ construct sector ===')
    let [vecs, lines] = construct(editor, sectors, line)
    if (vecs === null || lines.length < 3) continue
    if (duplicate(sectors, vecs)) continue
    if (!clockwise(vecs)) continue
    if (debug) console.debug('sector:')
    for (const vec of vecs) {
      if (debug) console.debug(' ', vec.x, vec.y)
    }
    if (debug) console.debug('@ push sector')
    let bottom = 0.0
    let floor = 0.0
    let ceiling = 0.0
    let top = 0.0
    let floorTexture = null
    let ceilingTexture = null
    if (editor.defaultSector) {
      const sector = editor.defaultSector
      bottom = sector.bottom
      floor = sector.floor
      ceiling = sector.ceiling
      top = sector.top
      floorTexture = sector.floorTexture
      ceilingTexture = sector.ceilingTexture
    }
    sectors.push(new SectorReference(bottom, floor, ceiling, top, floorTexture, ceilingTexture, vecs, lines))
  }

  transfer(editor.sectors, sectors)
  sectorInsideOutside(sectors)

  sectors.sort((a, b) => {
    // just for debugging
    if (a.otherIsInside(b)) return 1
    if (b.otherIsInside(a)) return -1
    if (a.vecs.length < b.vecs.length) return 1
    if (b.vecs.length > b.vecs.length) return -1
    return 0
  })

  for (const sector of sectors) {
    try {
      sectorTriangulateForEditor(sector, WORLD_SCALE)
    } catch (e) {
      console.error(e)
    }
  }

  lineNullSectors(editor.lines)
  sectorLineNeighbors(sectors, WORLD_SCALE)

  editor.sectors = sectors
  if (debug) console.debug(`$ end compute sectors and triangles (sector count := ${sectors.length})`)
}
