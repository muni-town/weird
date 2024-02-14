import { createRedisClient } from '../side-effects/create-redis-client.js'

const OK_MESSAGE = 'OK'
const REDIS_SECONDS_TOKEN = 'EX'

const _client = createRedisClient()

const _formatKey = (prefix, key) =>
  `${prefix}:${key}`

const setKey = async ({ prefix, key, value }) => {
  try {
    const formattedKey = _formatKey(prefix, key)
    const serializedValue = JSON.stringify(value)
    await _client.set(
      formattedKey,
      serializedValue
    )
    return [0, OK_MESSAGE]
  } catch (error) {
    return [1, error.message]
  }
}

const getKey = async ({ prefix, key }) => {
  try {
    const formattedKey = _formatKey(prefix, key)
    const data = await _client.get(formattedKey)
    return [0, data]
  } catch (error) {
    return [1, error.message]
  }
}

const deleteKey = async ({ prefix, key }) => {
  try {
    const formattedKey = _formatKey(prefix, key)
    await _client.del(formattedKey)
    return [0, OK_MESSAGE]
  } catch (error) {
    return [1, error.message]
  }
}

const keyExists = async ({ prefix, key }) => {
  try {
    const formattedKey = _formatKey(prefix, key)
    const exists = await _client.exists(
      formattedKey
    )
    return [0, exists === 1]
  } catch (error) {
    return [1, error.message]
  }
}

const incrementValue = async ({
  prefix,
  key
}) => {
  try {
    const formattedKey = _formatKey(prefix, key)
    const newValue = await _client.incr(
      formattedKey
    )
    return [0, newValue]
  } catch (error) {
    return [1, error.message]
  }
}

const decrementValue = async ({
  prefix,
  key
}) => {
  try {
    const formattedKey = _formatKey(prefix, key)
    const newValue = await _client.decr(
      formattedKey
    )
    return [0, newValue]
  } catch (error) {
    return [1, error.message]
  }
}

const setKeyWithExpiration = async ({
  prefix,
  key,
  value,
  expirationSeconds
}) => {
  try {
    const formattedKey = _formatKey(prefix, key)
    const serializedValue = JSON.stringify(value)
    await _client.set(
      formattedKey,
      serializedValue,
      REDIS_SECONDS_TOKEN,
      expirationSeconds
    )
    return [0, OK_MESSAGE]
  } catch (error) {
    return [1, error.message]
  }
}

const getKeysByPattern = async ({ pattern }) => {
  try {
    const keys = await _client.keys(pattern)
    return [0, keys]
  } catch (error) {
    return [1, error.message]
  }
}

const flushAll = async () => {
  try {
    await _client.flushall()
    return [0, OK_MESSAGE]
  } catch (error) {
    return [1, error.message]
  }
}

export {
  setKey,
  getKey,
  deleteKey,
  keyExists,
  incrementValue,
  decrementValue,
  setKeyWithExpiration,
  getKeysByPattern,
  flushAll
}
