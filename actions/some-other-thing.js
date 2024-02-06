export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  res.write(
    <div>
      <h1>Some other thing</h1>
      <p>Some other thing action route</p>
    </div>
  )

  res.end()
}
