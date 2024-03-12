import db from '../services/db-main.js'
import { createSession } from '../services/sessions.js'
import _env from '../consts/env.js'

import { Form as CreateAccountForm } from './create-account.js'
import { Document } from '../layouts/document.js'

import generateUniqueId from '../pure/generate-unique-id.js'

export const validation = async username => {
  const [usernameCode, usernameResult] = await db`
        SELECT weird_user_id
        FROM weird_users
        WHERE username = ${username}
        `

  if (usernameCode > 0) {
    throw new Error(usernameResult)
  }

  if (usernameResult.length > 0) {
    throw new Error('Username is already taken')
  }
}

const registerUser = async username => {
  const _userId = generateUniqueId({
    prefix: 'u'
  })

  const [code, result] = await db`
    INSERT INTO weird_users (weird_user_id, username)
    VALUES (${_userId}, ${username})
    RETURNING weird_user_id
  `

  console.log(code, result)

  return result[0].weird_user_id
}

export const Form = (props, children) => {
  const { error } = props || {}

  return (
    <>
      <form
        action='create-username'
        method='post'
        class='create-username'
      >
        <input
          type='text'
          name='username'
          placeholder='Username'
        />
        {error && <div>{error}</div>}
        <div>.weird.one</div>
        <button type='submit'>
          Create Account
        </button>
      </form>

      {css`
        .create-username {
          display: flex;
          flex-direction: column;

          input {
            margin-bottom: 10px;
          }
          div {
            margin-bottom: 10px;
          }
        }
      `}
    </>
  )
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
  const {
    res,
    formData,
    shouldSendHtmlFragment
  } = context
  const { username } = formData

  try {
    await validation(username)
    const weirdUserId = await registerUser(
      username
    )

    const sessionId = await _createSession({
      username,
      weirdUserId
    })

    console.log(
      `${_env.WEIRD_PROTOCOL}://${username}.${_env.BASE_URL}`
    )

    return (
      <HttpResponse
        res={res}
        status={302}
        headers={{
          'Set-Cookie': `sessionId=${sessionId}; Path=/; Secure; HttpOnly`,
          'Location': `${_env.WEIRD_PROTOCOL}://${username}.${_env.BASE_URL}`
        }}
      ></HttpResponse>
    )
  } catch (error) {
    return (
      <HttpResponse
        statusCode={422}
        res={res}
        headers={{
          'x-has-validation-error': 'true'
        }}
      >
        {shouldSendHtmlFragment ? (
          <Form error={error} />
        ) : (
          <Document>
            <Form error={error} />
          </Document>
        )}
      </HttpResponse>
    )
  }
}
