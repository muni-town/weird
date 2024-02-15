import { join } from 'node:path'

import { watch } from 'chokidar'

import IGNORED_PATHS from '../consts/file-watcher-ignored-paths.dev.js'

import transform from '../pure/transform-javascript.dev.js'

import getFileExtention from '../pure/get-file-extention.js'

import openFile from '../side-effects/open-file.js'
import writeFile from '../side-effects/write-file.js'

watch('.', {
  ignored: IGNORED_PATHS
}).on('all', async function (type, path, stats) {
  console.log('File change detected', path)

  const extention = getFileExtention(path)

  if (extention === '.js') {
    const fileContent = await openFile(path)

    const transformedContent =
      transform(fileContent)

    const filePath = join('dist', path)

    if (transformedContent === '') {
      console.log('transformedContent is empty')
      return
    }

    await writeFile(filePath, transformedContent)
  }

  //debouncedReload()
})
