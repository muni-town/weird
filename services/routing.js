import getRoute from '../pure/get-route.js'
import getSubdomain from '../pure/get-subdomain.js'

export async function handleRequest(req, res) {
  const host = req.headers.host
  const isSubdomain = host.split('.').length > 1

  const route = isSubdomain ? getSubdomain(host) : getRoute(req.url)

  route(req, res)
}
