export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  res.write(
    <>
      <p>Weird.inc</p>
    </>
  )
  res.end()
}
