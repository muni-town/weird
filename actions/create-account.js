import {
  createSession,
  getSession
} from '../services/sessions.js'

import { default as sql } from '../services/db-main.js'

import { hash } from '../pure/hash-and-verify-with-salt.js'
import generateUniqueId from '../pure/generate-unique-id.js'

const _createUser = async ({
  username,
  email,
  hashedPassword
}) => {
  const _userId = generateUniqueId({
    prefix: 'u'
  })

  const [createUserCode, createUserResult] =
    await sql`
      INSERT INTO weird_users
      (username, email, password, id, weird_id)
      VALUES
      (${username}, ${email}, ${hashedPassword}, ${_userId}, ${_userId})
      RETURNING id
    `
  if (createUserCode > 0) {
    throw new Error(createUserResult)
  }

  console.log(
    'createUserResult',
    createUserResult
  )

  const userId = createUserResult[0].id

  return userId
}

const _createSession = async sessionData => {
  const [createSessionCode, createSessionResult] =
    await createSession({
      sessionData
    })

  if (createSessionCode > 0) {
    throw new Error(createSessionResult)
  }

  const sessionId = createSessionResult

  return sessionId
}

const _getSession = async ({ sessionId }) => {
  const [getSessionCode, getSessionResult] =
    await getSession({
      sessionId
    })

  if (getSessionCode > 0) {
    throw new Error(getSessionResult)
  }

  const sessionData = getSessionResult

  return sessionData
}

const handler = async context => {
  const { res, formData } = context

  try {
    const { username, email, password } = formData

    const hashedPassword = await hash(password)

    const userId = await _createUser({
      username,
      email,
      hashedPassword
    })

    const sessionId = await _createSession({
      username,
      userId
    })

    const sessionData = await _getSession({
      sessionId
    })

    return (
      <HttpResponse
        res={res}
        status={200}
        headers={{
          'Content-Type': 'text/html',
          'Set-Cookie': `sessionId=${sessionId}; Path=/; Secure; HttpOnly`
        }}
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
    throw new Error(error)
  }
}

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

export { handler, Form }
