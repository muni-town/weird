import { extname as _extname } from 'node:path'

export default path => {
  return _extname(path)
}
