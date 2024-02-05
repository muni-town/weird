import { createServer as _createServer } from 'node:http'

import { handleRequest } from '../services/routing.js'

export default ({ name, port }) => {
  const server = _createServer(handleRequest)

  server.listen(port)

  console.log(
    `${name} server running on port ${port}`
  )

  return server
}
