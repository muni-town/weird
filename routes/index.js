import { Document } from '../layouts/document.js'
import { Landing } from '../layouts/landing.js'

export const pattern = new URLPattern({
  pathname: '/'
})

export const handler = context => {
  const { res, session } = context

  return (
    <HttpResponse res={res}>
      <Document>
        <script src='/index.js'></script>
        <Landing />
      </Document>
    </HttpResponse>
  )
}
