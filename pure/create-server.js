import { createServer as _createServer } from 'node:http'

import { handleRequest } from '../services/routing.js'

export default ({ name, port }) => {
  const serverInstance = _createServer(
    handleRequest
  )

  serverInstance.listen(port)

  console.log(
    `${name} server running on port ${port}`
  )

  return serverInstance
}
