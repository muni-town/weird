import indexRoute from '../routes/index.js'
import notFoundRoute from '../routes/404.js'

export function handleRequest(req, res) {
  let route

  switch (req.url) {
    case '/':
      route = indexRoute
      break
    default:
      route = notFoundRoute
  }

  route(req, res)
}
