import {WORLD_SCALE} from '../world/world.js'
import {sectorLineNeighbors, sectorInsideOutside} from '../map/sector.js'
import {clockwiseReflex, clockwiseInterior, sectorTriangulateForEditor} from '../map/triangulate.js'
import {SectorReference} from '../editor/map-edit-references.js'

const debug = false

function strvec(vec) {
  return JSON.stringify({x: vec.x, y: vec.y})
}

function nullLines(lines) {
  for (const line of lines) {
    line.plus = null
    line.minus = null
  }
}

function checkLines(lines) {
  for (const line of lines) {
    if (line.plus === null && line.minus === null) {
      console.warn('Line not linked between sectors:', line)
    }
  }
}

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

function isDuplicate(sectors, vecs) {
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
      if (debug) console.warn('% duplicate computed sector')
      return true
    }
  }
  return false
}

function isClockwise(vecs) {
  let sum = 0.0
  let len = vecs.length
  for (let i = 0; i < len; i++) {
    let k = i + 1 == len ? 0 : i + 1
    sum += (vecs[k].x - vecs[i].x) * (vecs[k].y + vecs[i].y)
  }
  if (sum >= 0.0) return true
  if (debug) console.warn('% counter-clockwise computed sector')
  return false
}

function isFirstTop(a, b) {
  return a.y < b.y
}

function isSecondTop(a, b, c) {
  return c.y <= b.y && clockwiseReflex(a, b, c)
}

function construct(editor, sectors, start) {
  let a = start.a
  let b = start.b
  if (!isFirstTop(a, b)) {
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
      if (line === start || !line.has(b)) continue
      let c = line.other(b)
      if (initial && debug) console.debug('(is 2nd top)', strvec(a), strvec(b), strvec(c), ':=', isSecondTop(a, b, c))
      if (initial && !isSecondTop(a, b, c)) continue
      let interior = clockwiseInterior(a, b, c)
      if (debug) console.debug('(interior)', strvec(a), strvec(b), strvec(c), ':=', interior)
      let wind = false
      if (initial && interior >= Math.PI) {
        interior = clockwiseInterior(c, b, a)
        wind = true
        if (debug) console.debug('(reversed interior)', interior)
      }
      if (interior < best) {
        second = line
        next = c
        best = interior
        reverse = wind
      }
    }
    if (second === null) {
      if (debug) console.debug('(not found)')
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
      if (debug) console.debug('(one)', a.x, a.y)
      if (debug) console.debug('(two)', b.x, b.y)
    }
    if (next === origin) {
      lines.push(second)
      return [vecs, lines]
    }
    if (debug) console.debug('(next)', next.x, next.y)
    if (vecs.indexOf(next) >= 0) {
      if (debug) console.debug('(bad)')
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
  if (debug) console.debug('^ start compute sectors')

  let sectors = []
  for (const line of editor.lines) {
    if (debug) console.debug('@ compute sector', strvec(line.a), strvec(line.b))
    if ((line.a.x == 46.0 || line.b.x == 46.0) && (line.a.y == 79.0 || line.b.y == 79.0)) console.error('xxxxxxxxxxxxxx')
    let [vecs, lines] = construct(editor, sectors, line)
    if (vecs === null || lines.length < 3) continue
    if (isDuplicate(sectors, vecs)) continue
    if (!isClockwise(vecs)) continue
    if (debug) console.debug('sector:')
    for (const vec of vecs) {
      if (debug) console.debug(' ', vec.x, vec.y)
    }
    if (debug) console.debug('# push sector')
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

  for (const sector of sectors) {
    try {
      sectorTriangulateForEditor(sector, WORLD_SCALE)
    } catch (e) {
      console.error(e)
    }
  }

  nullLines(editor.lines)
  sectorLineNeighbors(sectors, WORLD_SCALE)
  checkLines(editor.lines)

  editor.sectors = sectors
  if (debug) console.debug(`$ end compute sectors (sector count := ${sectors.length})`)
}
