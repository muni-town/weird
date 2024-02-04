import { liveReloadEmitter } from '../services/dev-server.js'

const clients = []

export default function liveReloadDevreq(
  req,
  res
) {
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

  // TODO: This is a memory leak
  liveReloadEmitter.on('reload', () => {
    res.write('data: Reload\n\n')
  })

  clients.push(res)
}
