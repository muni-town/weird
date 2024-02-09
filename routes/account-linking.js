import Document from '../layouts/document.js'

const scriptText = provider => `
// open a popup new window
// with the url

const url = '/auth/${provider}'
const popup = window.open(url, 'OAuthPopup', 'width=600,height=400')

// listen for messages from the popup
window.addEventListener('message', function (event) {
  if (event.origin !== window.location.origin) {
    return
  }

  // close the popup
  popup.close()

  // the event.data is the token
  // we can use it to make requests
  console.log('event.data', event.data)
})
`

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
      <button onclick={scriptText('github')}>
        link GitHub
      </button>
      <button onclick={scriptText('google')}>
        link Google
      </button>
      <button onclick={scriptText('discord')}>
        link Discord
      </button>
    </Document>
  )
}
