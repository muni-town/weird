import { readFile } from 'fs/promises'

export default async function openFile(path) {
  return await readFile(path, 'utf8')
}
