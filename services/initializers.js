import globFolder from '../side-effects/glob-folder.js'

const initializers = {}

const initializerFilePaths = globFolder([
  'dist',
  'initializers',
  '/*.js'
])

await Promise.all(
  initializerFilePaths.map(
    async initializerFilePath => {
      const fileName = initializerFilePath
        .split('/')
        .pop()

      const initializerName = fileName
        .split('.')
        .shift()

      const { run } = await import(
        initializerFilePath
      )

      initializers[initializerName] = {
        run
      }
    }
  )
)

Object.values(initializers).map(initializer => {
  initializer.run()
})

console.log('initializers run')

export { initializers }
