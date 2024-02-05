import {
  writeFile as _writeFile,
  mkdir as _mkdir
} from 'fs/promises'

export default async (path, data) => {
  try {
    // ensure the directory exists
    await _mkdir(
      path.split('/').slice(0, -1).join('/'),
      { recursive: true }
    )

    await _writeFile(path, data)
  } catch (error) {
    console.error('Error writing file', error)
  }
}
