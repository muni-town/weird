import {
  createSession
  // getSession
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
      (username, email, password, weird_user_id)
      VALUES
      (${username}, ${email}, ${hashedPassword}, ${_userId})
      RETURNING weird_user_id
    `

  if (createUserCode > 0) {
    throw new Error(createUserResult)
  }

  const userId = createUserResult[0].weird_user_id

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

export const handler = async context => {
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

    return (
      <HttpResponse
        res={res}
        status={302}
        headers={{
          'Location': '/account-linking/',
          'Set-Cookie': `sessionId=${sessionId}; Path=/; Secure; HttpOnly`
        }}
      />
    )
  } catch (error) {
    throw new Error(error)
  }
}

// TODO: this runs on every call. Should it? as a non-function it
// needs JSX to be imported and not a global, but we want that anyway
export const Form = ({ username, error }) => (
  <form
    action='create-account'
    method='post'
    class='create-account-form'
  >
    {error && <p>{error}</p>}
    <label for='username'>Username</label>
    <input
      type='text'
      id='username'
      name='username'
      value={username || ''}
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
