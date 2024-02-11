import parseURLEncodedFormData from '../pure/parse-url-encoded-form-data.js'
import env from '../consts/env.js'

const { RAUTHY_WEIRD_USERS_API_KEY } = env

export default async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.writeHead(405, {
        'Content-Type': 'text/plain'
      })
      return res.end('Method not allowed')
    }

    const formData =
      await parseURLEncodedFormData(req)

    const { username, email, password } = formData

    console.log(
      `Received form data: ${JSON.stringify(
        formData
      )}`
    )

    // NEXT: this works so far and Rauthy sends the email
    // but what happens after is yet to be determined
    let response = await fetch(
      'http://localhost:8080/auth/v1/users',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Fixed header name
          'Authorization': `API-Key ${RAUTHY_WEIRD_USERS_API_KEY}`
        },
        body: JSON.stringify({
          email,
          family_name: 'billy',
          given_name: 'xxxbilx',
          language: 'en',
          roles: ['admin'],
          password,
          email_verified: true
        })
      }
    )

    response = await response.json()

    const userId = response.id

    //  const password = 'hehehehxx'

    // let passwordResponse = await fetch(
    //   `http://localhost:8080/auth/v1/users/${userId}`,
    //   {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Accept': 'application/json',
    //       'Authorization': `API-Key ${RAUTHY_WEIRD_USERS_API_KEY}`
    //     },
    //     body: JSON.stringify({
    //       ...response,
    //       password,
    //       email
    //     })
    //   }
    // )

    // try {
    //   passwordResponse =
    //     await passwordResponse.json()
    // } catch (error) {
    //   passwordResponse =
    //     await passwordResponse.text()
    // }

    // console.log(
    //   'passwordResponse',
    //   passwordResponse
    // )

    // console.log('response', response)

    // DEMO

    // res.writeHead(200, {
    //   'Content-Type': 'text/plain'
    // })

    // res.end(
    //   `Received form data: ${JSON.stringify(
    //     passwordResponse
    //   )}`
    // )

    //redierct to account linking page
    res.writeHead(302, {
      Location:
        'http://localhost:8080/auth/v1/oidc/authorize?client_id=rauthy&redirect_uri=http://localhost:3000/account-linking&response_type=code&code_challenge=5t0V0BlCSNJpuEokTokdnG_OGiYVq-t7_XAuyXZmp7g&code_challenge_method=S256&scope=openid+profile+email&nonce=c6KsJlPKQFQN5cFQWIEinGgO&state=account'
    })

    res.end()

    // redierct to account linking page
    // res.writeHead(302, {
    //   Location: '/account-linking'
    // })

    // res.end()
  } catch (error) {
    console.error(
      'Error processing form data:',
      error
    )
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    })
    res.end('Internal Server Error')
  }
}

//http://localhost:8080/auth/v1/oidc/authorize?client_id=rauthy&redirect_uri=http://localhost:8080/auth/v1/oidc/callback&response_type=code&code_challenge=5t0V0BlCSNJpuEokTokdnG_OGiYVq-t7_XAuyXZmp7g&code_challenge_method=S256&scope=openid+profile+email&nonce=c6KsJlPKQFQN5cFQWIEinGgO&state=account
