export default function createOAuthClient(
  clientConfig
) {
  const {
    client_id,
    client_secret,
    redirect_uri,
    TOKEN_URL,
    TOKEN_REQUEST_ENCODING,
    AUTHORIZE_URL,
    USER_URL,
    scope,
    grant_type
  } = clientConfig

  return {
    getAutherizationUrl() {
      const params = new URLSearchParams({
        client_id,
        redirect_uri,
        scope: scope.join(' '),
        response_type: 'code'
      })

      return `${AUTHORIZE_URL}?${params}`
    },

    async getAccessToken(code) {
      const params = new URLSearchParams({
        client_id,
        client_secret,
        code,
        redirect_uri,
        grant_type
      })

      let response

      switch (TOKEN_REQUEST_ENCODING) {
        case 'application/x-www-form-urlencoded':
          response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded'
            },
            body: params.toString()
          })
          break
        case 'application/json':
          const url = `${TOKEN_URL}?${params}`
          response = await fetch(url, {
            method: 'POST',
            headers: {
              Accept: 'application/json'
            }
          })
      }

      return await response.json()
    },

    async getUser(token) {
      const response = await fetch(USER_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return await response.json()
    }
  }
}
