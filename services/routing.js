export function handleRequest(req, res) {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write('<h1>Welcome to the home page</h1>')
    res.end()
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.write('<h1>Page not found</h1>')
    res.end()
  }
}
