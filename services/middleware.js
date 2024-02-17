import globFolder from '../side-effects/glob-folder.js'

const middleware = {}

const middlewareFilePaths = globFolder([
  'dist',
  'middleware',
  '/*.js'
])

await Promise.all(
  middlewareFilePaths.map(
    async middlewareFilePath => {
      const fileName = middlewareFilePath
        .split('/')
        .pop()

      const middlewareName = fileName
        .split('.')
        .shift()

      const { run } = await import(
        middlewareFilePath
      )

      middleware[middlewareName] = {
        run
      }
    }
  )
)

export { middleware }
