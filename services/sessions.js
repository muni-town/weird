import env from '../consts/env.js'

const { RAUTHY_WEIRD_SESSIONS_API_KEY } = env

let response = await fetch(
  'http://localhost:8080/auth/v1/sessions',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `API-Key ${RAUTHY_WEIRD_SESSIONS_API_KEY}`
    }
  }
)

response = await response.json()

console.log('Sesresponse', { response })
