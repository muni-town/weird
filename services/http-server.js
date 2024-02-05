import env from '../consts/env.js'

import createServer from '../pure/create-server.js'

export const httpServer = createServer({
  name: 'HTTP',
  port: env.HTTP_SERVER_PORT
})
