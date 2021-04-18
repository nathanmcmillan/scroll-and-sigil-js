#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const proc = require('child_process')

const file = path.join('node_modules', '.bin', 'eslint.cmd')

const dir = path.join('public', 'src')

function findJs(start) {
  const list = []
  const files = fs.readdirSync(start)
  for (const f of files) {
    const file = path.join(start, f)
    const stat = fs.lstatSync(file)
    if (stat.isDirectory()) list.push(...findJs(file))
    else if (file.endsWith('.js')) list.push(file)
  }
  return list
}

const files = findJs(dir)

proc.execFile(file, ['--fix'].concat(files), (error, stdout, stderr) => {
  if (stdout) console.log(stdout)
  if (stderr) console.log(stderr)
  if (error && !stdout && !stderr) throw error
})
