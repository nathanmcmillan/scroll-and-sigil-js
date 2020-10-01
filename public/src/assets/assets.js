import {fetchText, fetchImage} from '/src/client/net.js'
import {createSpriteSheet} from '/src/assets/sprite-sheet.js'

import * as Wad from '/src/wad/wad.js'

const PROMISES = []

const TEXTURE_NAME_TO_INDEX = new Map()
const TEXTURES = []

export function saveTexture(name, texture) {
  let index = TEXTURES.length
  TEXTURE_NAME_TO_INDEX.set(name, index)
  TEXTURES.push(texture)
  return index
}

export function textureByIndex(index) {
  return TEXTURES[index]
}

export function textureIndexForName(name) {
  return TEXTURE_NAME_TO_INDEX.get(name)
}

export function textureByName(name) {
  let index = TEXTURE_NAME_TO_INDEX.get(name)
  return TEXTURES[index]
}

const SPRITE_IMAGES = new Map()

async function promiseImage(sprite) {
  if (SPRITE_IMAGES.has(sprite)) return
  let image = await fetchImage('/sprites/' + sprite + '/' + sprite + '.png')
  SPRITE_IMAGES.set(sprite, image)
}

const SPRITE_ATLASES = new Map()

async function promiseAtlas(sprite) {
  if (SPRITE_ATLASES.has(sprite)) return
  let text = await fetchText('/sprites/' + sprite + '/' + sprite + '.wad')
  SPRITE_ATLASES.set(sprite, Wad.parse(text))
}

const ENTITIES = new Map()
const ASYNC_SPRITE_NAMES = new Set()

async function promiseEntity(name, path) {
  if (ENTITIES.has(name)) {
    return
  }

  let text = await fetchText(path)
  let wad = Wad.parse(text)
  let sprite = wad.get('sprite')

  ENTITIES.set(name, wad)

  let image = promiseImage(sprite)
  let atlas = promiseAtlas(sprite)

  ASYNC_SPRITE_NAMES.add(sprite)

  await image
  await atlas
}

export function saveEntity(name, path) {
  PROMISES.push(promiseEntity(name, path))
}

export function entityByName(name) {
  return ENTITIES.get(name)
}

export async function waitForResources() {
  await Promise.all(PROMISES)
  PROMISES.length = 0
}

const SPRITE_SHEETS = new Map()

export function saveSprites(name, sprites) {
  SPRITE_SHEETS.set(name, sprites)
}

export function spritesByName(name) {
  return SPRITE_SHEETS.get(name)
}

export function createNewTexturesAndSpriteSheets(closure) {
  for (const sprite of ASYNC_SPRITE_NAMES) {
    if (SPRITE_SHEETS.has(sprite)) continue
    let image = SPRITE_IMAGES.get(sprite)
    let texture = closure(image)
    let sheet = createSpriteSheet(texture, SPRITE_ATLASES.get(sprite))
    saveTexture(sprite, texture)
    saveSprites(sprite, sheet)
  }
  ASYNC_SPRITE_NAMES.clear()
}
