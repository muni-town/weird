import globFolder from '../side-effects/glob-folder.js'
import { default as sql } from './db-main.js'

let migrations = {}

const migrationFilePaths = globFolder([
  'dist',
  'migrations',
  '/*.js'
])

async function getAppliedMigrations() {
  const [code, data] = await sql`
  SELECT * FROM schema_migration_details;
`

  if (code > 0) {
    console.error(
      'Error getting applied migrations:',
      results.message
    )

    return []
  }

  return data
}

async function runMigration({
  name,
  description,
  up
}) {
  try {
    console.log(`Applying migration: ${name}`)
    const start = Date.now()
    await up()
    const end = Date.now()
    const duration = end - start
    await sql`
    INSERT INTO schema_migration_details (
      version,
      name,
      git_version,
      duration,
      direction
    ) VALUES (
      ${name},
      ${description},
      'git_version',
      ${duration},
      'up'
    );
  `
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

async function rollbackMigration({ name, down }) {
  try {
    console.log(`Rolling back migration: ${name}`)
    await down()
    await sql`
    DELETE FROM schema_migration_details
    WHERE version = ${name};
  `
    console.log(
      `Migration '${name}' rolled back successfully.`
    )
  } catch (error) {
    console.error(
      `Error rolling back migration '${name}':`,
      error
    )
  }
}

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

const appliedMigrations =
  await getAppliedMigrations()

for (const appliedMigration of appliedMigrations) {
  delete migrations[appliedMigration.version]
}

export async function ensureMigrationTableExists() {
  const [code, error] = await sql`
  CREATE TABLE IF NOT EXISTS schema_migration_details (
    version VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    git_version VARCHAR(255),
    duration INTEGER,
    direction VARCHAR(4),
    ran_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`

  if (code > 0) {
    console.error(
      'Error creating schema_migration_details table:',
      error
    )
  }
}

export async function runMigrations() {
  if (Object.keys(migrations).length === 0) {
    console.log('No migrations to run.')
    return
  }

  console.log('Running migrations...')

  for (const [name, migration] of Object.entries(
    migrations
  )) {
    await runMigration({ name, ...migration })
  }

  console.log('All migrations completed.')
}
