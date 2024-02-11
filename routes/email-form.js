import parseQueryString from '../pure/parse-query-string.js'

import Document from '../layouts/document.js'

export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  const { username } = parseQueryString(req)

  res.end(
    <Document>
      <form
        action='/actions/register-email'
        method='post'
      >
        <input
          type='hidden'
          name='username'
          value={username}
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
  )
}
