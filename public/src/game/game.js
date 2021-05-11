/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { textureIndexForName } from '../assets/assets.js'
import { playMusic } from '../assets/sound-manager.js'
import { fetchText } from '../client/net.js'
import { Camera, cameraFollowCinema, cameraTowardsTarget } from '../game/camera.js'
import { Line } from '../map/line.js'
import { Sector } from '../map/sector.js'
import { Vector2 } from '../math/vector.js'
import { Hero } from '../thing/hero.js'
import { wad_parse } from '../wad/wad.js'
import { Flags } from '../world/flags.js'
import { Trigger } from '../world/trigger.js'
import { World, worldBuild, worldClear, worldPushSector, worldPushTrigger, worldSetLines, worldSpawnEntity, worldUpdate } from '../world/world.js'

function texture(name) {
  if (name === 'none') return -1
  return textureIndexForName(name)
}

export class Game {
  constructor(parent, input) {
    this.parent = parent
    this.input = input
    this.world = new World(this)
    this.hero = null
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, 12.0)
    this.cinema = false
  }

  read(content) {
    const world = this.world
    worldClear(world)

    const vecs = []
    const lines = []

    try {
      const wad = wad_parse(content)

      for (const vec of wad.get('vectors')) {
        vecs.push(new Vector2(parseFloat(vec.get('x')), parseFloat(vec.get('z'))))
      }

      for (const line of wad.get('lines')) {
        const a = vecs[parseInt(line.get('s'))]
        const b = vecs[parseInt(line.get('e'))]
        const top = texture(line.get('t'))
        const middle = texture(line.get('m'))
        const bottom = texture(line.get('b'))
        const flags = line.has('flags') ? new Flags(line.get('flags')) : null
        const trigger = line.has('trigger') ? new Trigger(line.get('trigger')) : null
        lines.push(new Line(top, middle, bottom, a, b, flags, trigger))
      }

      for (const sector of wad.get('sectors')) {
        const bottom = parseFloat(sector.get('b'))
        const floor = parseFloat(sector.get('f'))
        const ceiling = parseFloat(sector.get('c'))
        const top = parseFloat(sector.get('t'))
        const floorTexture = texture(sector.get('u'))
        const ceilingTexture = texture(sector.get('v'))
        const sectorVecs = sector.get('vecs').map((x) => vecs[parseInt(x)])
        const sectorLines = sector.get('lines').map((x) => lines[parseInt(x)])
        const flags = sector.has('flags') ? new Flags(sector.get('flags')) : null
        const trigger = sector.has('trigger') ? new Trigger(sector.get('trigger')) : null
        worldPushSector(world, new Sector(bottom, floor, ceiling, top, floorTexture, ceilingTexture, flags, trigger, sectorVecs, sectorLines))
      }

      worldSetLines(world, lines)
      worldBuild(world)

      if (wad.has('things')) {
        for (const thing of wad.get('things')) {
          const x = parseFloat(thing.get('x'))
          const z = parseFloat(thing.get('z'))
          const name = thing.get('id')
          const flags = thing.has('flags') ? new Flags(thing.get('flags')) : null
          const trigger = thing.has('trigger') ? new Trigger(thing.get('trigger')) : null
          const entity = worldSpawnEntity(world, name, x, z, flags, trigger)
          if (entity instanceof Hero) {
            this.hero = entity
            this.camera.target = this.hero
          }
        }
      }

      if (wad.has('triggers')) {
        for (const trigger of wad.get('triggers')) worldPushTrigger(world, new Trigger(trigger))
      }

      if (wad.has('meta')) {
        for (const meta of wad.get('meta')) {
          if (meta[0] === 'music') playMusic(meta[1])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  async load(file) {
    const map = await fetchText(file)
    this.read(map)
  }

  update() {
    const input = this.input
    const camera = this.camera

    if (!this.cinema) {
      if (input.y()) {
        camera.ry -= 0.05
        if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
      }

      if (input.a()) {
        camera.ry += 0.05
        if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
      }

      // if (input.rightUp()) {
      //   camera.rx -= 0.05
      //   if (camera.rx < -0.5 * Math.PI) camera.rx = -0.5 * Math.PI
      // }
      // if (input.rightDown()) {
      //   camera.rx += 0.05
      //   if (camera.rx > 0.5 * Math.PI) camera.rx = 0.5 * Math.PI
      // }

      if (input.rightStickX !== 0.0) {
        camera.ry += input.rightStickX * 0.05
        if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
        else if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
      }

      // if (input.rightStickY !== 0.0) {
      //   camera.rx += input.rightStickY * 0.05
      //   if (camera.rx < -0.4 * Math.PI) camera.rx = -0.4 * Math.PI
      //   else if (camera.rx > 0.4 * Math.PI) camera.rx = 0.4 * Math.PI
      // }

      camera.target.rotation = camera.ry - 0.5 * Math.PI
    }

    worldUpdate(this.world)

    if (this.cinema) cameraTowardsTarget(camera)
    else cameraFollowCinema(camera, this.world)
  }

  notify(type, args) {
    switch (type) {
      case 'cinema':
        this.cinema = true
        return
      case 'no-cinema':
        this.cinema = false
        return
    }
    this.parent.notify(type, args)
  }
}
