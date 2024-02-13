import {
  setKeyWithExpiration,
  getKey,
  getKeysByPattern,
  deleteKey,
  keyExists
} from './db-mem.js'

import generateUniqueId from '../pure/generate-unique-id.js'

import { SESSION_PREFIX } from '../consts/db-mem-key-prefixes.js'
import { SESSION_EXPIRATION } from '../consts/db-mem-key-expirations.js'
const SESSION_UNIQUE_ID_PREFIX = 's'

export async function createSession({
  sessionData
}) {
  const sessionId = generateUniqueId({
    prefix: SESSION_UNIQUE_ID_PREFIX
  })

  const result = await setKeyWithExpiration({
    prefix: SESSION_PREFIX,
    key: sessionId,
    value: sessionData,
    expirationSeconds: SESSION_EXPIRATION
  })

  if (result.code !== 0) {
    console.error(
      'Error creating session:',
      result.message
    )
    return null
  }

  return sessionId
}

export async function getSession({ sessionId }) {
  return await getKey({
    prefix: SESSION_PREFIX,
    key: sessionId
  })
}

export async function deleteSession({
  sessionId
}) {
  return await deleteKey({
    prefix: SESSION_PREFIX,
    key: sessionId
  })
}

export async function sessionExists({
  sessionId
}) {
  return await keyExists({
    prefix: SESSION_PREFIX,
    key: sessionId
  })
}

export async function getSessionsByPattern({
  pattern
}) {
  return await getKeysByPattern({
    prefix: SESSION_PREFIX,
    pattern
  })
}
