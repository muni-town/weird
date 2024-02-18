import { getSession } from '../services/sessions.js'

const SESSION_COOKIE_NAME = 'sessionId'

const run = async context => {
  const { cookies } = context

  const sessionId = cookies[SESSION_COOKIE_NAME]

  console.log('sessionId', sessionId)

  if (sessionId) {
    context.session = await getSession({
      sessionId
    })
  }
}

export { run }
