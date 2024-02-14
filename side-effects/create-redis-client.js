import { default as _Redis } from 'ioredis'
import env from '../consts/env.js'

const { REDIS_HOST, REDIS_PORT } = env

const createRedisClient = ({
  host = REDIS_HOST,
  port = REDIS_PORT
} = {}) => {
  try {
    return new _Redis({
      host,
      port
    })
  } catch (error) {
    // TODO: should this exit the process?
    console.error(error)
    return null
  }
}

export { createRedisClient }
