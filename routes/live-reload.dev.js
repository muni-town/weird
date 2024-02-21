//import { liveReloadEmitter } from '../services/dev-server.js'

const matches = ['/live-reload']

const clients = []

// TODO: streaming <HttpResponse> with no .end()
const handler = context => {
  const { req, res } = context
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  res.write('data: Connected\n\n')

  req.on('close', () => {
    console.log('Client dropped me')
    clients.splice(clients.indexOf(res), 1)
  })

  clients.push(res)
}

export { handler, matches }

// TODO: huh, why nextTick?
// process.nextTick(() => {
//   liveReloadEmitter.on('reload', () => {
//     console.log('Reloading')
//     clients.forEach(client => {
//       client.write('data: Reload\n\n')
//     })
//   })
// })
