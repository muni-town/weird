export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  res.write('<h1>create-account route</h1>')
  res.end()
}
