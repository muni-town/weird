import Document from '../layouts/document.js'

export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  res.write('<!DOCTYPE html>')

  res.write(
    <Document>
      <h1>Weird.inc index</h1>
      <p>Welcome to the index page</p>
      <img
        src='https://placekitten.com/200/300'
        alt='A cute kitten'
      />
    </Document>
  )

  res.end()
}
