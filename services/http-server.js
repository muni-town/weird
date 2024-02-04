import { createServer } from 'node:http'

import { handleRequest } from './routing.js'

export const httpServer = (() => {
  const serverInstance = createServer(
    handleRequest
  )

  serverInstance.listen(3000)

  console.log('Server is listening on port 3000')

  return serverInstance
})()
