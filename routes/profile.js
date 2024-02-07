import Document from '../layouts/document.js'
import Profile from '../layouts/profile.js'

export default (req, res) => {
  const host = req.headers.host
  const [username] = host.split('.')

  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  res.write('<!DOCTYPE html>')

  res.write(
    <Document>
      <Profile username={username} />
    </Document>
  )

  res.end()
}
