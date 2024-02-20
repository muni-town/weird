//import getRoute from '../pure/get-route.js'
//import getSubdomain from '../pure/get-subdomain.js'

import { forms } from './forms.js'
import { routes } from './routes.js'

import {
  middleware,
  globalMiddleware
} from './middleware.js'

import profileRoute from '../routes/profile.js'

const getSubdomain = host => {
  // TODO: subdomain matching beyond user profiles
  // for stuff like CDN and email

  let route

  route = profileRoute

  return route
}

//import { routes } from './routes.js'

const getRoute = url => {
  let route = routes['404']

  // TODO urlpattern api + globbing so we can skip
  // this manual stuff below and the imports above

  // startsWith('/auth/')

  if (url === '/') {
    route = routes.index
  } else if (
    url.endsWith('.js') ||
    url.endsWith('.css')
  ) {
    // TODO: hack
    route = routes['serve-file']
  } else if (url.startsWith('/actions/')) {
    //
    // TODO: clean this up
    const action = url.split('/').pop()

    if (forms[action]) {
      route = forms[action].handler
    }
    // TODO: glob actions on boot so we don't have to the promise dance
  } else if (url.startsWith('/callbacks/')) {
    route = routes['ouath-callbacks']
  } else if (
    url.startsWith('/account-linking/')
  ) {
    route = routes['account-linking']
  } else if (url.startsWith('/auth/')) {
    route = routes['external-oauth']
  }

  return route
}

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

  // Object.values(globalMiddleware).forEach(
  //   ({ run }) => run(context)
  // )

  // // with for of we can use async/await
  // for (const middlewareName of route.middleware) {
  //   const { run } = middleware[middlewareName]
  //   await run(context)
  // }

  // same with global middleware
  for (const middlewareName of globalMiddleware) {
    const { run } = middlewareName
    await run(context)
  }

  console.log(globalMiddleware)

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

  // form data
  if (
    req.headers['content-type'] ===
    'multipart/form-data'
  ) {
    context.formData =
      await parseMultipartFormData(req)
  }

  // get cookies
  context.cookies = req.headers.cookie
    ? req.headers.cookie
        .split(';')
        .reduce((cookies, cookie) => {
          const [name, value] = cookie.split('=')
          cookies[name.trim()] = value
          return cookies
        }, {})
    : {}

  // if query params
  context.queryParams = parseQueryParams(req)

  return context
}

import { URL as _URL } from 'node:url'

function parseQueryParams(req) {
  // Parse the request URL
  const parsedUrl = new _URL(
    req.url,
    `http://${req.headers.host}`
  )

  // Access the query parameters as an object
  const queryParams = Object.fromEntries(
    parsedUrl.searchParams.entries()
  )

  return queryParams
}

async function parseMultipartFormData(req) {
  let formData = ''
  for await (const chunk of req) {
    formData += chunk
  }

  const boundary = formData.split('\r\n')[0] // Extract the boundary from the first line
  const parts = formData.split(boundary) // Split the formData using the boundary
  const parsedData = {}

  for (let part of parts) {
    if (part.trim().length === 0) continue // Skip empty parts

    const nameMatch = part.match(/name="(.+?)"/) // Extract the name attribute
    const dataMatch = part.match(
      /\r\n\r\n([\s\S]*)\r\n/
    ) // Extract the data between \r\n\r\n and \r\n

    if (nameMatch && dataMatch) {
      const name = nameMatch[1]
      const value = dataMatch[1]
      parsedData[name] = value
    }
  }

  return parsedData
}
