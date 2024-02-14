import { createPostgresClient } from '../side-effects/create-postgres-client.js'

const _client = createPostgresClient()

export default async function db(
  query,
  ...values
) {
  try {
    const results = await _client(
      query,
      ...values
    )
    return [0, results]
  } catch (error) {
    return [1, error.message]
  }
}

// usage:
// import { db } from './services/db-main.js'
//
// const [thingCode, thingResult] = await db`
//   SELECT * FROM users WHERE id = ${userId}
// `
//
// if (thingCode > 0) {
//   throw new Error(thingResult)
// }
//
// do stuff...
