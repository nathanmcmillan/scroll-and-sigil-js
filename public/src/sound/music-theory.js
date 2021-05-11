/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

export const MUSIC_SCALE_LIST = [
  'Major',
  'Minor',
  'Pentatonic Major',
  'Pentatonic Minor',
  'Harmonic Major',
  'Harmonic Minor',
  'Melodic Minor',
  'Augmented',
  'Blues',
  'Whole Tone',
  'Algerian',
]

export const MUSIC_SCALE = new Map()

MUSIC_SCALE.set('Major', [2, 2, 1, 2, 2, 2, 1])
MUSIC_SCALE.set('Minor', [2, 1, 2, 2, 1, 2, 2])
MUSIC_SCALE.set('Pentatonic Major', [2, 2, 3, 2, 3])
MUSIC_SCALE.set('Pentatonic Minor', [3, 2, 2, 3, 2])
MUSIC_SCALE.set('Harmonic Major', [2, 2, 1, 2, 1, 3, 1])
MUSIC_SCALE.set('Harmonic Minor', [2, 1, 2, 2, 1, 3, 1])
MUSIC_SCALE.set('Melodic Minor', [2, 1, 2, 2, 2, 2, 1])
MUSIC_SCALE.set('Augmented', [3, 1, 3, 1, 3, 1])
MUSIC_SCALE.set('Blues', [3, 2, 1, 1, 3, 2])
MUSIC_SCALE.set('Whole Tone', [2, 2, 2, 2, 2, 2])
MUSIC_SCALE.set('Algerian', [2, 1, 3, 1, 1, 3, 1, 2, 1, 2])

export function musicScale(root, mode) {
  const steps = MUSIC_SCALE.get(mode)
  const out = [root]
  let index = NOTES.indexOf(root)
  for (let i = 0; i < steps.length; i++) {
    index += steps[i]
    if (index >= NOTES.length) index -= NOTES.length
    out.push(NOTES[index])
  }
  return out
}
