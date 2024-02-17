import getRoute from '../pure/get-route.js'
import getSubdomain from '../pure/get-subdomain.js'

import { middleware } from './middleware.js'

export async function handleRequest(req, res) {
  const host = req.headers.host
  const isSubdomain = host.split('.').length > 1

  const context = await createContext(req, res)

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
    // TODO: we really don't want unnecessary promises
    route = await route
    console.log('route', route)
  }

  Object.values(middleware).forEach(({ run }) =>
    run(context)
  )

  route(context)
}

import parseURLEncodedFormData from '../pure/parse-url-encoded-form-data.js'

// TODO: we really don't want unnecessary promises
async function createContext(req, res) {
  const context = {
    req,
    res
  }

  if (
    req.headers['content-type'] ===
    'application/x-www-form-urlencoded'
  ) {
    context.formData =
      await parseURLEncodedFormData(req)
  }

  return context
}
