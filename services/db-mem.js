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
    return [
      0, // code
      'Operation successful'
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
  }
}

export async function getKey({ prefix, key }) {
  try {
    const formattedKey = formatKey(prefix, key)
    const data = await redis.get(formattedKey)
    return [
      0, // code
      data
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
  }
}

export async function deleteKey({ prefix, key }) {
  try {
    const formattedKey = formatKey(prefix, key)
    await redis.del(formattedKey)
    return [
      0, // code
      'Operation successful'
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
  }
}

export async function keyExists({ prefix, key }) {
  try {
    const formattedKey = formatKey(prefix, key)
    const exists = await redis.exists(
      formattedKey
    )
    return [
      0, // code
      exists === 1
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
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
    return [
      0, // code
      newValue
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
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
    return [
      0, // code
      newValue
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
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
    return [
      0, // code
      'Operation successful'
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
  }
}

export async function getKeysByPattern({
  pattern
}) {
  try {
    const keys = await redis.keys(pattern)
    return [
      0, // code
      keys
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
  }
}

export async function flushAll() {
  try {
    await redis.flushall()
    return [
      0, // code
      'Operation successful'
    ]
  } catch (error) {
    return [
      1, // code
      error.message
    ]
  }
}

function formatKey(prefix, key) {
  return `${prefix}:${key}`
}
