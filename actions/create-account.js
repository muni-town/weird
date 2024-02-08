import parseURLEncodedFormData from '../pure/parse-url-encoded-form-data.js'

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

    // const { username } = formData

    const { honeypot } = formData

    if (honeypot) {
      // it's a bot
      res.writeHead(400, {
        'Content-Type': 'text/plain'
      })

      return res.end('Bad Request')
      // TODO: log the attempt
    }

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
