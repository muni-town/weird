import Document from '../layouts/document.js'
import Landing from '../layouts/landing.js'

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
        <div>
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
        </div>
        <Landing />
      </Document>
    </HttpResponse>
  )
}
