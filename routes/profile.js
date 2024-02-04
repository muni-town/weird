export default function (req, res) {
  const host = req.headers.host
  const [username] = host.split('.')

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`Subdomain for profile: ${username}`)
}
