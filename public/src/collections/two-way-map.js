/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export class TwoWayMap {
  constructor() {
    this.map = new Map()
    this.reverse = new Map()
  }

  set(a, b) {
    this.map.set(a, b)
    this.reverse.set(b, a)
  }

  get(k) {
    return this.map.get(k)
  }

  has(k) {
    return this.map.has(k)
  }

  reversed(k) {
    return this.reverse.get(k)
  }
}
