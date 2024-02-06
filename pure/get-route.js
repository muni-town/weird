import indexRoute from '../routes/index.js'
import notFoundRoute from '../routes/404.js'
import liveReloadRoute from '../routes/live-reload.dev.js'

export default url => {
  let route = notFoundRoute

  console.log(url)

  // TODO urlpattern api + globbing so we can skip
  // this manual stuff below and the imports above

  if (url === '/') {
    route = indexRoute
  } else if (url === '/live-reload') {
    route = liveReloadRoute
  } else if (url.startsWith('/actions/')) {
    //
    // TODO: clean this up
    const action = url.split('/').pop()

    return import(`../actions/${action}.js`).then(
      ({ default: actionRoute }) => {
        console.log('actionRoute', actionRoute)
        return actionRoute
      }
    )
    // TODO: glob actions on boot so we don't have to the promise dance
  }

  return route
}
