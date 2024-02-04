export default (req, res) => {
  res.writeHead(404, {
    'Content-Type': 'text/html'
  })
  res.write('<h1>Page not found</h1>')
  res.end()
}
