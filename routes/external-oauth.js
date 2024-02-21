import { oAuthClients } from '../services/oauth-clients.js'

const pattern = new URLPattern({
  pathname: '/auth/:provider'
})

const handler = context => {
  const { req, res } = context

  const { url } = req
  const provider = url.split('/').pop()

  const client = oAuthClients[provider]
  const authUrl = client.getAutherizationUrl()

  return client ? (
    <HttpResponse
      res={res}
      status={302}
      headers={{
        Location: authUrl
      }}
    >
      Redirecting to {provider}
    </HttpResponse>
  ) : (
    <HttpResponse
      res={res}
      status={404}
      headers={{ 'Content-Type': 'text/plain' }}
    >
      Not found
    </HttpResponse>
  )
}

export { handler, pattern }
