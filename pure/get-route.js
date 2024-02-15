import { forms } from '../services/forms.js'
import { routes } from '../services/routes.js'

export default url => {
  let route = routes['404']

  // TODO urlpattern api + globbing so we can skip
  // this manual stuff below and the imports above

  // startsWith('/auth/')

  if (url === '/') {
    route = routes.index
  } else if (
    url.endsWith('.js') ||
    url.endsWith('.css')
  ) {
    // TODO: hack
    route = routes['serve-file']
  } else if (url.startsWith('/actions/')) {
    //
    // TODO: clean this up
    const action = url.split('/').pop()

    if (forms[action]) {
      route = forms[action].handler
    }
    // TODO: glob actions on boot so we don't have to the promise dance
  }

  return route
}
