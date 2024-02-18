import { oAuthClients } from '../services/oauth-clients.js'

export default async context => {
  const { req, res, queryParams } = context
  const { code } = queryParams

  console.log('query', queryParams)

  const { url } = req

  console.log('url', url)

  const provider = url
    .split('?')[0]
    .split('/')
    .pop()

  const client = oAuthClients[provider]

  const { access_token } =
    await client.getAccessToken(code)

  // console.log('token', token)

  // const authUrl = client.getAutherizationUrl()

  const user = await client.getUser(access_token)

  return client ? (
    <HttpResponse
      res={res}
      status={200}
      headers={{
        'Content-Type': 'text/plain'
      }}
    >
      {JSON.stringify(user)}
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
