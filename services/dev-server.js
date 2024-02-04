import { httpServer } from './http-server.js'
import { EventEmitter } from 'node:events'

import createServer from '../pure/create-server.js'
import env from '../consts/env.js'

export const liveReloadEmitter =
  new EventEmitter()

export const devServer = createServer({
  name: 'Dev',
  port: env.DEV_SERVER_PORT
})
