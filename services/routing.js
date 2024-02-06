import getRoute from '../pure/get-route.js'
import getSubdomain from '../pure/get-subdomain.js'

export function handleRequest(req, res) {
  const host = req.headers.host
  const isSubdomain = host.split('.').length > 1

  let route = isSubdomain
    ? getSubdomain(host)
    : getRoute(req.url)

  if (route instanceof Promise) {
    route.then(route => route(req, res))
    return
  }

  route(req, res)
}
