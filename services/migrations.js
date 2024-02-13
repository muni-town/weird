import globFolder from '../side-effects/glob-folder.js'

let migrations = {}

const migrationFilePaths = globFolder([
  'migrations',
  '/*.js'
])

await Promise.all(
  migrationFilePaths.map(
    async migrationFilePath => {
      try {
        const {
          default: { name, description, up, down }
        } = await import(migrationFilePath)

        const fileName = migrationFilePath
          .split('/')
          .pop()

        migrations[name] = {
          fileName,
          description,
          up,
          down
        }
      } catch (error) {
        console.error(
          `Error importing migration file: ${migrationFilePath}`,
          error
        )
      }
    }
  )
)

const sortedMigrations = Object.entries(
  migrations
).sort(
  ([, a], [, b]) =>
    parseInt(a.fileName) - parseInt(b.fileName)
)

migrations = Object.fromEntries(sortedMigrations)

export async function runMigrations() {
  if (Object.keys(migrations).length === 0) {
    console.log('No migrations to run.')
    return
  }

  console.log('Running migrations...')
  for (const [name, migration] of Object.entries(
    migrations
  )) {
    try {
      console.log(`Applying migration: ${name}`)
      await migration.up()
      console.log(
        `Migration '${name}' applied successfully.`
      )
    } catch (error) {
      console.error(
        `Error applying migration '${name}':`,
        error
      )
    }
  }
  console.log('All migrations completed.')
}
