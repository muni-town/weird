import Redis from 'ioredis'
import env from '../consts/env.js'

const { REDIS_HOST, REDIS_PORT } = env

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT
})

export async function setKey({
  prefix,
  key,
  value
}) {
  try {
    const formattedKey = formatKey(prefix, key)
    const serializedValue = JSON.stringify(value)
    await redis.set(formattedKey, serializedValue)
    return {
      code: 0,
      message: 'Operation successful'
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}

export async function getKey({ prefix, key }) {
  try {
    const formattedKey = formatKey(prefix, key)
    const data = await redis.get(formattedKey)
    return {
      code: 0,
      message: 'Operation successful',
      data
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
      data: null
    }
  }
}

export async function deleteKey({ prefix, key }) {
  try {
    const formattedKey = formatKey(prefix, key)
    await redis.del(formattedKey)
    return {
      code: 0,
      message: 'Operation successful'
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}

export async function keyExists({ prefix, key }) {
  try {
    const formattedKey = formatKey(prefix, key)
    const exists = await redis.exists(
      formattedKey
    )
    return {
      code: 0,
      message: 'Operation successful',
      data: exists === 1
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
      data: null
    }
  }
}

export async function incrementValue({
  prefix,
  key
}) {
  try {
    const formattedKey = formatKey(prefix, key)
    const newValue = await redis.incr(
      formattedKey
    )
    return {
      code: 0,
      message: 'Operation successful',
      data: newValue
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
      data: null
    }
  }
}

export async function decrementValue({
  prefix,
  key
}) {
  try {
    const formattedKey = formatKey(prefix, key)
    const newValue = await redis.decr(
      formattedKey
    )
    return {
      code: 0,
      message: 'Operation successful',
      data: newValue
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
      data: null
    }
  }
}

export async function setKeyWithExpiration({
  prefix,
  key,
  value,
  expirationSeconds
}) {
  try {
    const formattedKey = formatKey(prefix, key)
    const serializedValue = JSON.stringify(value)
    await redis.set(
      formattedKey,
      serializedValue,
      'EX',
      expirationSeconds
    )
    return {
      code: 0,
      message: 'Operation successful'
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}

export async function getKeysByPattern({
  pattern
}) {
  try {
    const keys = await redis.keys(pattern)
    return {
      code: 0,
      message: 'Operation successful',
      data: keys
    }
  } catch (error) {
    return {
      code: 1,
      message: error.message,
      data: null
    }
  }
}

export async function flushAll() {
  try {
    await redis.flushall()
    return {
      code: 0,
      message: 'Operation successful'
    }
  } catch (error) {
    return { code: 1, message: error.message }
  }
}

function formatKey(prefix, key) {
  return `${prefix}:${key}`
}
