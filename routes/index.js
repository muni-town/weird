import { Document } from '../layouts/document.js'
import { Landing } from '../layouts/landing.js'

export const pattern = new URLPattern({
  pathname: '/'
})

export const handler = context => {
  const { res } = context

  return (
    <HttpResponse res={res}>
      <Document>
        <Script
          res={res}
          src='/index.js'
        />
        <Landing context={context} />
      </Document>
    </HttpResponse>
  )
}
