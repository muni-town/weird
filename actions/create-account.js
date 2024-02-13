import parseURLEncodedFormData from '../pure/parse-url-encoded-form-data.js'

import {
  createSession,
  getSession
} from '../services/sessions.js'

export default async (req, res) => {
  try {
    const formData =
      await parseURLEncodedFormData(req)

    const { username, email, password } = formData

    const sessionId = await createSession({
      sessionData: {
        username,
        email,
        password
      }
    })

    const sessionData = await getSession({
      sessionId
    })

    res.writeHead(200, {
      'Content-Type': 'text/plain'
    })
    res.end(
      `You submitted: ${JSON.stringify(
        formData
      )} and your session ID is: ${sessionId}
      
      Your session data is: ${JSON.stringify(
        sessionData
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
