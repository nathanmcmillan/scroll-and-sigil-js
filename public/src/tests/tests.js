import {compress, decompress} from '/src/compress/huffman.js'

let s = 'this is an example for huffman encoding'
// 'foobar test me string for huffman compression'
console.log('input:', s)

let c = compress(s)
console.log('compressed:', c)

let d = decompress(c)
console.log('decompress:', d)
