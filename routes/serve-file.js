import openFile from '../side-effects/open-file.js'
import { getMimeType } from '../pure/get-mime-type.js'

const allowedFileTypes = [
  'js',
  'css',
  'html',
  'jpg',
  'png'
]

// TODO: ooof
export const pattern = new URLPattern({
  pathname:
    '/*.:filetype(' +
    allowedFileTypes.join('|') +
    ')'
})

// TODO: streaming <HttpResponse>
export const handler = async context => {
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
