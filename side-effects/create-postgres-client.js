import { default as _postgres } from 'postgres'

import env from '../consts/env.js'

const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USERNAME,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE
} = env

const createPostgresClient = ({
  host = POSTGRES_HOST,
  username = POSTGRES_USERNAME,
  password = POSTGRES_PASSWORD,
  database = POSTGRES_DATABASE,
  port = POSTGRES_PORT
} = {}) => {
  try {
    return _postgres({
      host,
      username,
      password,
      database,
      port
    })
  } catch (error) {
    // TODO: should this exit the process?
    console.error(error)
    return null
  }
}

export { createPostgresClient }
