const fs = require('fs')
const path = require('path')

const directory = 'sprites'

fs.readdir(directory, (error, files) => {
  files.forEach((name) => {
    let join = path.join(directory, name)
    let stat = fs.statSync(join)
    if (stat.isDirectory()) {
      console.log('is dir', join)
    } else if (stat.isFile()) {
      console.log('is file', join)
    }
  })
})
