import Document from '../layouts/document.js'

export default (req, res) => {
  res.writeHead(404, {
    'Content-Type': 'text/html'
  })

  res.write(
    <Document>
      <h1>404</h1>
      <p>Page not found</p>
    </Document>
  )

  res.end()
}
