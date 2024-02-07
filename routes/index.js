import Document from '../layouts/document.js'
import Landing from '../layouts/landing.js'

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
