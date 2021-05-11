/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { new_synth_parameters, synth, SYNTH_IO, WAVEFORMS } from '../sound/synth.js'
import { wad_parse } from '../wad/wad.js'

export class SynthSound {
  constructor(content) {
    this.parameters = new_synth_parameters()
    try {
      read_sound_wad(this.parameters, content)
    } catch (e) {
      console.error(e)
    }
  }

  play() {
    synth(this.parameters)
  }
}

export class SynthMusic {
  constructor(content) {
    // this.parameters = new_synth_parameters()
    try {
      // read_sound_wad(this.parameters, content)
    } catch (e) {
      console.error(e)
    }
  }

  play() {
    synth(this.parameters)
  }

  pause() {}
}

export function read_synth_parameters(out, parameters) {
  for (const [name, value] of parameters) {
    for (let a = 0; a < SYNTH_IO.length; a++) {
      if (SYNTH_IO[a] === name) {
        if (name === 'wave') {
          for (let w = 0; w < WAVEFORMS.length; w++) {
            if (WAVEFORMS[w] === value) {
              out[a] = w
              break
            }
          }
        } else {
          out[a] = parseFloat(value)
        }
        break
      }
    }
  }
}

export function read_sound_wad(out, content) {
  const wad = wad_parse(content)
  const parameters = wad.get('parameters')
  read_synth_parameters(out, parameters)
  return wad
}

export function read_music_wad(out, content) {
  const wad = wad_parse(content)

  const name = wad.get('music')
  const tempo = parseInt(wad.get('tempo'))

  const tracks = []

  for (const data of wad.get('tracks')) {
    const name = data.get('name')
    const parameters = data.get('parameters')
    const notes = data.get('notes')
    const track = new Track(name)
    track.tuning = parseInt(data.get('tuning'))
    read_synth_parameters(track.parameters, parameters)
    for (const note of notes) {
      const a = parseInt(note[0])
      const b = parseInt(note[1])
      const c = parseInt(note[2])
      const d = parseInt(note[3])
      track.notes.push([a, b, c, d])
    }
    tracks.push(track)
  }
}
