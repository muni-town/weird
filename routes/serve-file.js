import openFile from '../side-effects/open-file.js'

function getMimeType(url) {
  let mimeType = 'text/html'
  if (url.endsWith('.js')) {
    mimeType = 'text/javascript'
  } else if (url.endsWith('.css')) {
    mimeType = 'text/css'
  } else if (url.endsWith('.png')) {
    mimeType = 'image/png'
  } else if (url.endsWith('.jpg')) {
    mimeType = 'image/jpeg'
  } else if (url.endsWith('.gif')) {
    mimeType = 'image/gif'
  }
  return mimeType
}

// TODO: streaming <HttpResponse>
export default async context => {
  const { req, res } = context
  const url = req.url
  const clientPath = process.cwd() + '/client'
  const filePath = clientPath + url

  try {
    const content = await openFile(filePath)
    res.writeHead(200, {
      'Content-Type': getMimeType(url)
    })
    res.write(content)
    res.end()
  } catch (err) {
    console.error('error', err)
    res.writeHead(404, {
      'Content-Type': 'text/html'
    })
    res.write('404 Not Found')
  }
}
