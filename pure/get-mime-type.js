const getMimeType = url => {
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

export { getMimeType }
