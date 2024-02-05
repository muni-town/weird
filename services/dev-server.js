import { EventEmitter } from 'node:events'
import { join } from 'node:path'

import { watch } from 'chokidar'

import createServer from '../pure/create-server.js'

import transpileWithBabel from '../pure/transpile-with-babel.dev.js'
import debounce from '../pure/debounce.js'

import env from '../consts/env.js'

import openFile from '../side-effects/open-file.js'
import writeFile from '../side-effects/write-file.js'

import { extname } from 'node:path'

import { IGNORED_PATHS } from '../consts/file-watcher-ignored-paths.dev.js'

export const liveReloadEmitter =
  new EventEmitter()

export const devServer = createServer({
  name: 'Dev',
  port: env.DEV_SERVER_PORT
})

const debouncedReload = debounce(() => {
  liveReloadEmitter.emit('reload')
})

watch('.', {
  ignored: IGNORED_PATHS
}).on('all', async function (type, path, stats) {
  console.log('File change detected', path)

  const extention = extname(path)

  if (extention === '.js') {
    const fileContent = await openFile(path)

    const transpiledContent =
      transpileWithBabel(fileContent)

    const filePath = join('dist', path)

    await writeFile(filePath, transpiledContent)
  }

  debouncedReload()
})
