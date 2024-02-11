import getRoute from '../pure/get-route.js'
import getSubdomain from '../pure/get-subdomain.js'

export function handleRequest(req, res) {
  const host = req.headers.host
  const isSubdomain = host.split('.').length > 1

  // TODO: find a better place for this
  // we want to use forms for POST requests only
  if (
    req.url.includes('/actions/') &&
    req.method !== 'POST'
  ) {
    res.writeHead(405, {
      'Content-Type': 'text/plain'
    })
    return res.end('Method not allowed')
  }

  let route = isSubdomain
    ? getSubdomain(host)
    : getRoute(req.url)

  if (route instanceof Promise) {
    route.then(route => route(req, res))
    return
  }

  route(req, res)
}
