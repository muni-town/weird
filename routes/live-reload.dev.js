import { liveReloadEmitter } from '../services/dev-server.js'

const clients = []

export default (req, res) => {
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

// TODO: huh, why nextTick?
process.nextTick(() => {
  liveReloadEmitter.on('reload', () => {
    console.log('Reloading')
    clients.forEach(client => {
      client.write('data: Reload\n\n')
    })
  })
})
