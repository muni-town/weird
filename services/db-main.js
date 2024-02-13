import postgres from 'postgres'

const sql = postgres({
  host: 'localhost',
  username: 'postgres',
  password: 'password',
  database: 'postgres',
  port: 5432
})

export async function db(query, ...values) {
  try {
    const results = await sql(query, ...values)
    return {
      code: 0,
      message: 'Operation successful',
      data: results
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
      data: null
    }
  }
}

// usage:
// import { db } from './services/db.js'
//
// const results = await db`
//   SELECT * FROM users WHERE id = ${userId}
// `
//
// if (results.code === 0) {
//   console.log(results.data)
// } else {
//   console.error(results.message)
// }
