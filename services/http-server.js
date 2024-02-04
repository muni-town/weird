import createServer from '../pure/create-server.js'
import env from '../consts/env.js'

export const httpServer = (() =>
  createServer({
    name: 'HTTP',
    port: env.HTTP_SERVER_PORT
  }))()
