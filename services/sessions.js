import {
  setKeyWithExpiration,
  getKey,
  getKeysByPattern,
  deleteKey,
  keyExists
} from './db-mem.js'

import { SESSION_PREFIX } from '../consts/db-mem-key-prefixes.js'
import { SESSION_EXPIRATION } from '../consts/db-mem-key-expirations.js'

export async function createSession({
  sessionId,
  sessionData
}) {
  return await setKeyWithExpiration({
    prefix: SESSION_PREFIX,
    key: sessionId,
    value: sessionData,
    expiration: SESSION_EXPIRATION
  })
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
