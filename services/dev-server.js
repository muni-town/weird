// import { join } from 'node:path'

// import { watch } from 'chokidar'

// import IGNORED_PATHS from '../consts/file-watcher-ignored-paths.dev.js'
import env from '../consts/env.js'

import createServer from '../pure/create-server.js'
import createEventEmitter from '../pure/create-event-emitter.js'
// import transform from '../pure/transform-javascript.dev.js'
// import debounce from '../pure/debounce.js'
// import getFileExtention from '../pure/get-file-extention.js'

// import openFile from '../side-effects/open-file.js'
// import writeFile from '../side-effects/write-file.js'

console.log(
  'env.DEV_SERVER_PORT',
  env.DEV_SERVER_PORT
)

export const liveReloadEmitter =
  createEventEmitter()

export const devServer = createServer({
  name: 'Dev',
  port: env.DEV_SERVER_PORT
})

// const debouncedReload = debounce(() =>
//   liveReloadEmitter.emit('reload')
// )

// watch('.', {
//   ignored: IGNORED_PATHS
// }).on('all', async function (type, path, stats) {
//   console.log('File change detected', path)

//   const extention = getFileExtention(path)

//   if (extention === '.js') {
//     const fileContent = await openFile(path)

//     const transformedContent =
//       transform(fileContent)

//     const filePath = join('dist', path)

//     if (transformedContent === '') {
//       console.log('transformedContent is empty')
//       return
//     }

//     await writeFile(filePath, transformedContent)
//   }

//   debouncedReload()
// })
