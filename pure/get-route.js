import indexRoute from '../routes/index.js'
import notFoundRoute from '../routes/404.js'

export default url => {
  let route

  switch (url) {
    case '/':
      route = indexRoute
      break
    default:
      route = notFoundRoute
  }

  return route
}
