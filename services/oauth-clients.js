import clientConfig from '../consts/oauth-client-config.js'
import createOAuthClient from '../pure/create-oauth-client.js'

export const oAuthClients = {}

Object.entries(clientConfig).forEach(
  ([provider, config]) => {
    oAuthClients[provider] =
      createOAuthClient(config)
  }
)
