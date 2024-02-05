import { httpServer } from './http-server.js'

import { EventEmitter } from 'node:events'

import { watch } from 'chokidar'

import createServer from '../pure/create-server.js'
import openFile from '../side-effects/open-file.js'
import transpileWithBabel from '../pure/transpile-with-babel.dev.js'
import env from '../consts/env.js'

export const liveReloadEmitter =
  new EventEmitter()

export const devServer = createServer({
  name: 'Dev',
  port: env.DEV_SERVER_PORT
})

watch('.', {
  ignoreInitial: true
}).on('all', async function (type, path, stats) {
  console.log('File change detected', path)
  const fileContent = await openFile(path)
  const transpiledContent =
    transpileWithBabel(fileContent)

  console.log(
    'Transpiled content',
    transpiledContent
  )

  liveReloadEmitter.emit('reload')
})
