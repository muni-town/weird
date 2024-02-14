import { default as _postgres } from 'postgres'

import env from '../consts/env.js'

const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USERNAME,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE
} = env

const sql = _postgres({
  host: POSTGRES_HOST,
  username: POSTGRES_USERNAME,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
  port: POSTGRES_PORT
})

export default async function db(
  query,
  ...values
) {
  try {
    const results = await sql(query, ...values)
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
