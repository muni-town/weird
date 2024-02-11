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

    //const { username, email, password } = formData

    res.writeHead(200, {
      'Content-Type': 'text/plain'
    })

    res.end(
      `You submitted: ${JSON.stringify(formData)}`
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
