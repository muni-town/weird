import { createServer } from 'node:http'

function startServer() {
  const server = createServer((req, res) => {
    res.end('Hello World')
  })

  server.listen(3000, () => {
    console.log('Server is running on port 3000')
  })

  return server
}

const server = startServer()

export default { server }
