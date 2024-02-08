import { parse as _parse } from 'node:querystring'

export default async req => {
  let body = ''

  for await (const chunk of req) {
    body += chunk
  }

  return _parse(body)
}
