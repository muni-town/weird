import { randomBytes as _randomBytes } from 'node:crypto'

const SIZE = 5

// base58
const ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export default ({ prefix }) => {
  let id = new Uint8Array(SIZE)

  id = _randomBytes(SIZE)

  for (let i = 0; i < SIZE; i++) {
    id[i] = ALPHABET.charCodeAt(
      id[i] % ALPHABET.length
    )
  }

  return `${prefix}-${String.fromCharCode.apply(
    null,
    id
  )}`
}

// if (typeof window !== 'undefined' && window.crypto) {
//   // Browser
//   window.crypto.getRandomValues(id)
// } else {
//   // Node
//   id = crypto.randomBytes(size)
// }
