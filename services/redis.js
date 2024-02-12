import Redis from 'ioredis'

import env from '../consts/env.js'

const { REDIS_HOST, REDIS_PORT } = env

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT
})

export default redis
