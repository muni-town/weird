import { Head } from '../elements/head.js'
import { Header } from '../elements/header.js'

export const Document = (props, children) =>
  [
    '<!DOCTYPE html>',
    <html>
      <Head />
      <body>
        <Header />
        {children}
      </body>
    </html>
  ].join('')
