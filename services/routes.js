import globFolder from '../side-effects/glob-folder.js'

const routes = {}

const routeFilePaths = globFolder([
  'dist',
  'routes',
  '/*.js'
])

await Promise.all(
  routeFilePaths.map(async routeFilePath => {
    const fileName = routeFilePath
      .split('/')
      .pop()

    const routeName = fileName.split('.').shift()

    const route = await import(routeFilePath)

    routes[routeName] = route
  })
)

export { routes }
