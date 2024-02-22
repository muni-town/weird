import { getSession } from '../services/sessions.js'

const SESSION_COOKIE_NAME = 'sessionId'

export const run = async context => {
  const { cookies } = context

  const sessionId = cookies[SESSION_COOKIE_NAME]

  if (sessionId) {
    const [getSessionCode, getSessionResult] =
      await getSession({
        sessionId
      })

    if (getSessionCode > 0) {
      console.error(getSessionResult)
      return
    }

    const session = getSessionResult

    if (session !== null) {
      context.session = JSON.parse(session)
    }
  }
}
