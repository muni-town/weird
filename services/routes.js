import globFolder from '../side-effects/glob-folder.js'

const routes = {}

// TODO: why dist? bleeeh
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

    const { handler, matches } = await import(
      routeFilePath
    )

    routes[routeName] = handler
  })
)

export { routes }
