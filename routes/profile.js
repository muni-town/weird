import { Document } from '../layouts/document.js'
import { Profile } from '../layouts/profile.js'

export const pattern = new URLPattern({
  hostname: '{username}.example.com'
})

export const handler = context => {
  const { req, res } = context

  const host = req.headers.host
  const [username] = host.split('.')

  return (
    <HttpResponse
      res={res}
      // TODO: tighten up the CORS policy
      headers={{
        'Access-Control-Allow-Origin': '*'
      }}
    >
      <Document>
        <Profile username={username} />
      </Document>
    </HttpResponse>
  )
}
