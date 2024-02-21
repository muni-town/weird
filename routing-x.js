// Import the http module and the URLPattern polyfill
import http from 'node:http'

// Define your routes
const routes = [
  {
    pattern: new URLPattern({ pathname: '/' }),
    method: 'GET',
    handler: (req, res) => {
      res.end('Hello, world!')
    }
  },
  {
    match: {
      pathname: '/users/:id'
    },
    method: 'GET',
    handler: (req, res, match) => {
      const userId = match.params.id
      res.end(`User ${userId}`)
    }
  }
]

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Find a matching route
  const route = routes.find(route => {
    const pattern = urlPattern(route.path)
    return (
      pattern.test(req.url) &&
      pattern.path.method === req.method
    )
  })

  if (route) {
    // Call the handler function with the matched parameters
    const match = urlPattern
      .parse(route.path)
      .exec(req.url)
    route.handler(req, res, match.params)
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

// Start the server on port 3000
server.listen(3000, () => {
  console.log('Server listening on port 3000')
})
