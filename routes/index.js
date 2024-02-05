export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })
  res.write(
    <div>
      <h1>Hello, world!</h1>
      <p>
        This is a JSX file transformed to a
        string.
      </p>
    </div>
  )
  res.end()
}
