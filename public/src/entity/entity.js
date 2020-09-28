import {spritesByName} from '/src/assets/assets.js'

export function animationMap(entity) {
  let sheet = spritesByName(entity.get('sprite'))
  if (entity.has('animation')) {
    let animation = entity.get('animation')
    if (Array.isArray(animation)) {
      let list = []
      for (const sprite of animation) {
        list.push(sheet.get(sprite))
      }
      return list
    } else {
      return sheet.get(animation)
    }
  } else {
    let map = new Map()
    for (const [name, animation] of entity.get('animations')) {
      let entry = []
      for (const sprite of animation) {
        entry.push(sheet.get(sprite))
      }
      map.set(name, entry)
    }
    return map
  }
}
