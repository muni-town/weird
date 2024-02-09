import parseQueryString from '../pure/parse-query-string.js'

import Document from '../layouts/document.js'

export default (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })

  res.end(
    <Document>
      <h2>
        let's pretend you went through the email
        link stuff and land here
      </h2>
      <button>link GitHub</button>
      <button>link Google</button>
      <button>link Discord</button>
    </Document>
  )
}
