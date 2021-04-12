import { fetchText } from '../client/net.js'
import { Hymn } from '../hymn/hymn.js'

async function main() {
  const input = await fetchText('./test_hymn_1.hm')
  console.log('input:', input)
  const hymn = new Hymn(input)
  const output = hymn.eval()
  console.log('output:', output)
}

main()
