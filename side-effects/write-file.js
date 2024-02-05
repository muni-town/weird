import {
  writeFile as nodeWriteFile,
  mkdir
} from 'fs/promises'

export default async function writeFile(
  path,
  data
) {
  // ensure the directory exists
  await mkdir(
    path.split('/').slice(0, -1).join('/'),
    { recursive: true }
  )

  return await nodeWriteFile(path, data)
}
