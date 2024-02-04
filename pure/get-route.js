import indexRoute from '../routes/index.js'
import notFoundRoute from '../routes/404.js'
import liveReloadRoute from '../routes/live-reload.dev.js'

export default url => {
  let route

  switch (url) {
    case '/':
      route = indexRoute
      break
    case '/live-reload':
      route = liveReloadRoute
      break
    default:
      route = notFoundRoute
  }

  return route
}
