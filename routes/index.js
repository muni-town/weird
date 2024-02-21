import Document from '../layouts/document.js'
import Landing from '../layouts/landing.js'

const matches = ['/']

const handler = context => {
  const { res, session } = context

  return (
    <HttpResponse
      res={res}
      status={200}
      headers={{ 'Content-Type': 'text/html' }}
    >
      <Document>
        <script src='/index.js'></script>
        <Landing />
      </Document>
    </HttpResponse>
  )
}

export { handler, matches }

{
  /* <div>
          {session ? (
            <>
              <h1>Session</h1>
              <pre>
                {JSON.stringify(session, null, 2)}
              </pre>
            </>
          ) : (
            ''
          )}
        </div> */
}
