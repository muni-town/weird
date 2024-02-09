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

    const { username, email } = formData

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
          roles: ['admin']
        })
      }
    )

    //console.log('response', response)

    res.writeHead(200, {
      'Content-Type': 'text/plain'
    })

    res.end(
      `Received form data: ${JSON.stringify(
        formData
      )}`
    )
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
