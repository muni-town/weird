import { parse as _parse } from 'node:querystring'

export default async req => {
  try {
    let body = ''

    for await (const chunk of req) {
      body += chunk
    }

    return _parse(body)
  } catch (err) {
    // TODO: errors should be returned as values to the caller
    console.error(err)
    return {}
  }
}
