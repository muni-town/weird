import Document from '../layouts/document.js'

const handler = context => {
  const { res } = context

  return (
    <HttpResponse
      res={res}
      status={404}
      headers={{ 'Content-Type': 'text/html' }}
    >
      <Document>
        <h1>404</h1>
        <p>Page not found</p>
      </Document>
    </HttpResponse>
  )
}

export { handler }
