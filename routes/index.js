import Document from '../layouts/document.js'
import Landing from '../layouts/landing.js'
import Header from '../elements/header.js'

// import { oAuthClients } from '../services/oauth-clients.js'
// import redisClient from '../services/redis.js'

// console.log(redisClient)

// console.log(oAuthClients)

export default context => {
  const { res } = context
  const { session } = context

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
