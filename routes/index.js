import Document from '../layouts/document.js'
import Landing from '../layouts/landing.js'

// import { oAuthClients } from '../services/oauth-clients.js'
// import redisClient from '../services/redis.js'

// console.log(redisClient)

// console.log(oAuthClients)

export default context => {
  const { res } = context

  return (
    <HttpResponse
      res={res}
      status={200}
      headers={{ 'Content-Type': 'text/html' }}
    >
      {'<!DOCTYPE html>'}
      <Document>
        <Landing />
      </Document>
    </HttpResponse>
  )
}
