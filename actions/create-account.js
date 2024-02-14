import {
  createSession,
  getSession
} from '../services/sessions.js'

export default async context => {
  const { req, res, formData } = context
  const { username, email, password } = formData

  try {
    const [
      createSessionCode,
      createSessionResult
    ] = await createSession({
      sessionData: {
        username,
        email,
        password
      }
    })

    if (createSessionCode > 0) {
      throw new Error(createSessionResult)
    }

    const sessionId = createSessionResult

    const [getSessionCode, getSessionResult] =
      await getSession({
        sessionId
      })

    if (getSessionCode > 0) {
      throw new Error(getSessionResult)
    }

    const sessionData = getSessionResult

    return (
      <HttpResponse
        res={res}
        status={200}
        headers={{ 'Content-Type': 'text/html' }}
      >
        <div>
          <h1>Account Created</h1>
          <p>
            You submitted:
            {JSON.stringify(formData)}
          </p>
          <p>Your session ID is: {sessionId}</p>
          <p>
            Your session data is:
            {JSON.stringify(sessionData)}
          </p>
        </div>

        {css`
          h1 {
            color: green;
          }
        `}
      </HttpResponse>
    )
  } catch (error) {
    return (
      <HttpResponse
        res={res}
        error={error}
        status={500}
        message={`error parsing form data: ${error.message}`}
      />
    )
  }
}
