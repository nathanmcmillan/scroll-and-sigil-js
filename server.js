const http = require('http')
const fs = require('fs')
const path = require('path')

const port = 3000
const directory = 'public'

const extensions = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
}

let server = http.createServer(function (request, response) {
  console.log('request', request.url)
  let file = request.url
  if (file === '/') {
    file = '/index.html'
  }
  file = directory + file
  let extension = path.extname(file)
  let mime = extensions[extension] || 'text/plain'
  fs.readFile(file, function (error, content) {
    if (error) {
      response.writeHead(404, {'Content-Type': 'text/plain'})
      response.end('404', 'utf-8')
    } else {
      response.writeHead(200, {'Content-Type': mime})
      response.end(content, 'utf-8')
    }
  })
})

server.listen(port)

console.log('serving on port', port)
