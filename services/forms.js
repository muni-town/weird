import globFolder from '../side-effects/glob-folder.js'

const forms = {}

const formFilePaths = globFolder([
  'dist',
  'actions',
  '/*.js'
])

await Promise.all(
  formFilePaths.map(async formFilePath => {
    const fileName = formFilePath.split('/').pop()

    const formName = fileName.split('.').shift()

    const { handler, form } = await import(
      formFilePath
    )

    forms[formName] = {
      handler,
      form
    }
  })
)

export { forms }
