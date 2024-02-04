import { createServer } from 'node:http'
import { handleRequest } from './routing.js'

function startServer() {
  const server = createServer(handleRequest)

  server.listen(3000, () => {
    console.log('Server is running on port 3000')
  })

  return server
}

const server = startServer()

export default { server }
