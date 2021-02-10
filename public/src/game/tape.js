export class Tape {
  constructor(name) {
    this.name = name
    this.entities = []
    this.maps = []
    this.music = []
    this.sounds = []
    this.sprites = []
    this.textures = []
    this.tiles = []
  }

  read() {}

  export() {
    let content = `tape ${this.name}\n`
    content += '^ entities\n'
    for (const entity of this.entities) content += `${entity}\n`
    content += '$ entities\n'
    content += '^ maps\n'
    content += '$ maps\n'
    content += '^ music\n'
    for (const music of this.music) content += `${music}\n`
    content += '$ music\n'
    content += '^ sounds\n'
    for (const sound of this.sounds) content += `${sound}\n`
    content += '$ sounds\n'
    content += '^ sprites\n'
    content += '$ sprites\n'
    content += 'textures\n'
    content += '$ textures\n'
    content += '^ tiles\n'
    for (const tile of this.tiles) content += `${tile}\n`
    content += '$ tiles\n'
    content += '$ tape\n'
    return content
  }
}
