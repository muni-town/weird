import Head from '../elements/head.js'
import Header from '../elements/header.js'

export default (props, children) => (
  <html>
    <Head />
    <body>
      <Header />
      {children}
    </body>
  </html>
)
