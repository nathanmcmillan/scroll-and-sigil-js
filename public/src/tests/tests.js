import {compress, decompress} from '/src/compress/huffman.js'

let s = 'foobar test me string for huffman compression'
console.log(s)

let c = compress(s)
console.log(c)

let d = decompress(c)
console.log(d)
