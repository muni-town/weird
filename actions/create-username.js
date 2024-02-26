import db from '../services/db-main.js'

import { Form as CreateAccountForm } from './create-account.js'
import { Document } from '../layouts/document.js'

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
export const handler = async context => {
  const {
    res,
    formData,
    shouldSendHtmlFragment
  } = context
  const { username } = formData

  try {
    await validation(username)
    return (
      <HttpResponse res={res}>
        <div>
          <h1>Username is available</h1>
          success
        </div>
      </HttpResponse>
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
