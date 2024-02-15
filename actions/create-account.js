import {
  createSession,
  getSession
} from '../services/sessions.js'

// TODO: this runs on every call. Should it? as a non-function it
// needs JSX to be imported and not a global, but we want that anyway
const Form = () => (
  <form
    action='create-account'
    method='post'
    class='create-account-form'
  >
    <div>lol</div>
    <label for='username'>Username</label>
    <input
      type='text'
      id='username'
      name='username'
    />
    <label for='email'>Email</label>
    <input
      type='email'
      id='email'
      name='email'
    />
    <label for='password'>Password</label>
    <input
      type='password'
      id='password'
      name='password'
    />
    <button type='submit'>Create Account</button>

    {css`
      .create-account-form {
        display: grid;
        background-color: red;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #ccc;

        label {
          display: block;
        }

        input {
          font-size: 1rem;
          padding: 0.5rem;
        }

        button {
          font-size: 1rem;
          padding: 0.5rem 1rem;
          background-color: #f60;
          color: white;
          border: none;
          border-radius: 0.25rem;
        }
      }
    `}
  </form>
)

const handler = async context => {
  const { res, formData } = context

  try {
    const { username, email, password } = formData

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

export { Form, handler }
