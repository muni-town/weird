import { oAuthClients } from '../services/oauth-clients.js'

export default (req, res) => {
  const { url } = req
  const provider = url.split('/').pop()

  const client = oAuthClients[provider]

  if (!client) {
    res.writeHead(404)
    res.end('Not found')
  }

  const authUrl = client.getAutherizationUrl()

  res.writeHead(302, {
    Location: authUrl
  })
  res.end()
}
