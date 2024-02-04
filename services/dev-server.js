import { createServer } from 'node:http'
import { EventEmitter } from 'node:events'

import { handleRequest } from './routing.js'

export const liveReloadEmitter =
  new EventEmitter()

export const devServer = (() => {
  const serverInstance = createServer(
    handleRequest
  )

  serverInstance.listen(3002)

  console.log(
    'dev server is listening on port 3002'
  )

  return serverInstance
})()
