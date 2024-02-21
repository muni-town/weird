import parseQueryString from '../pure/parse-query-string.js'

import Document from '../layouts/document.js'

const handler = context => {
  const { req, res } = context

  return (
    <HttpResponse
      res={res}
      status={200}
      headers={{ 'Content-Type': 'text/html' }}
    >
      <Document>
        <form
          action='register-email'
          method='post'
        >
          <input
            type='hidden'
            name='username'
            value={parseQueryString(req).username}
          />

          <label>
            Email
            <input
              type='email'
              name='email'
            />
          </label>

          <label>
            Password
            <input
              type='password'
              name='password'
            />
          </label>
          <button type='submit'>Submit</button>
        </form>
      </Document>
    </HttpResponse>
  )
}

export { handler }
