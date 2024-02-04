export default function indexRoute(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.write('<h1>Welcome to the home page!</h1>')
  res.end()
}
