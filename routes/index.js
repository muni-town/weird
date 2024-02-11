import Document from '../layouts/document.js'
import Landing from '../layouts/landing.js'

// import { oAuthClients } from '../services/oauth-clients.js'

// console.log(oAuthClients)

export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  res.write('<!DOCTYPE html>')

  res.write(
    <Document>
      <Landing />
    </Document>
  )

  res.end()
}
