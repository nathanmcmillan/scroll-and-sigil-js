import {fetchText} from '/src/client/net.js'
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

const SPRITE_SHEETS = new Map()

export function saveSprites(name, sprites) {
  SPRITE_SHEETS.set(name, sprites)
}

export function spritesByName(name) {
  return SPRITE_SHEETS.get(name)
}

const ENTITIES = new Map()

async function fetchEntity(name, path) {
  let text = await fetchText(path)
  ENTITIES.set(name, Wad.parse(text))
}

export function saveEntity(name, path) {
  PROMISES.push(fetchEntity(name, path))
}

export function entityByName(name) {
  return ENTITIES.get(name)
}

export async function waitForResources() {
  await Promise.all(PROMISES)
  PROMISES.length = 0
}
