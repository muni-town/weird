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

const createSession = async ({ sessionData }) => {
  const sessionId = generateUniqueId({
    prefix: SESSION_UNIQUE_ID_PREFIX
  })

  const [code, error] =
    await setKeyWithExpiration({
      prefix: SESSION_PREFIX,
      key: sessionId,
      value: sessionData,
      expirationSeconds: SESSION_EXPIRATION
    })

  return code > 0 ? [code, error] : [0, sessionId]
}

const getSession = ({ sessionId }) =>
  getKey({
    prefix: SESSION_PREFIX,
    key: sessionId
  })

const deleteSession = ({ sessionId }) =>
  deleteKey({
    prefix: SESSION_PREFIX,
    key: sessionId
  })

const checkIfSessionExists = ({ sessionId }) =>
  keyExists({
    prefix: SESSION_PREFIX,
    key: sessionId
  })

const getSessionsByPattern = ({ pattern }) =>
  getKeysByPattern({
    prefix: SESSION_PREFIX,
    pattern
  })

export default {
  createSession,
  getSession,
  deleteSession,
  checkIfSessionExists,
  getSessionsByPattern
}
