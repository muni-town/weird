import { URL as _URL } from 'node:url'

export default req => {
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
