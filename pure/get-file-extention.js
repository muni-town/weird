import { extname as _extname } from 'node:path'

export const getFileExtention = path => {
  return _extname(path)
}
