/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

// prettier-ignore
const numbers = [
  0, 8, 109, 220, 222, 241, 149, 107, 75, 248, 254, 140, 16, 66,
  74, 21, 211, 47, 80, 242, 154, 27, 205, 128, 161, 89, 77, 36,
  95, 110, 85, 48, 212, 140, 211, 249, 22, 79, 200, 50, 28, 188,
  52, 140, 202, 120, 68, 145, 62, 70, 184, 190, 91, 197, 152, 224,
  149, 104, 25, 178, 252, 182, 202, 182, 141, 197, 4, 81, 181, 242,
  145, 42, 39, 227, 156, 198, 225, 193, 219, 93, 122, 175, 249, 0,
  175, 143, 70, 239, 46, 246, 163, 53, 163, 109, 168, 135, 2, 235,
  25, 92, 20, 1, 138, 77, 69, 166, 78, 176, 173, 212, 166, 113,
  94, 161, 41, 50, 239, 49, 111, 164, 70, 60, 2, 37, 171, 75,
  136, 156, 11, 56, 42, 146, 138, 229, 73, 146, 77, 61, 98, 196,
  135, 106, 63, 197, 195, 86, 96, 203, 113, 101, 170, 247, 181, 113,
  80, 250, 108, 7, 255, 237, 129, 226, 79, 107, 112, 166, 103, 241,
  24, 223, 239, 120, 198, 58, 60, 82, 128, 3, 184, 66, 143, 224,
  145, 224, 81, 206, 163, 45, 63, 90, 168, 114, 59, 33, 159, 95,
  28, 139, 123, 98, 125, 196, 15, 70, 194, 253, 54, 14, 109, 226,
  71, 17, 161, 93, 186, 87, 244, 138, 20, 52, 123, 251, 26, 36,
  17, 46, 52, 231, 232, 76, 31, 221, 84, 37, 216, 165, 212, 106,
  197, 242, 98, 43, 39, 175, 254, 145, 190, 84, 118, 222, 187, 136,
  120, 163, 236, 249
]

let pIndex = 0
let mIndex = 0

export function pRandom() {
  pIndex++
  if (pIndex === 256) pIndex = 0
  return numbers[pIndex]
}

export function mRandom() {
  mIndex++
  if (mIndex === 256) mIndex = 0
  return numbers[mIndex]
}

export function pRandomOf(range) {
  return pRandom() % range
}

export function mRandomOf(range) {
  return mRandom() % range
}

export function clearRandom() {
  pIndex = 0
  mIndex = 0
}

export function randomFloat() {
  return Math.random()
}

export function randomInt(number) {
  return Math.floor(Math.random() * number)
}
