// open a popup new window
// with the url

const authButtons = document.querySelectorAll(
  '.provider-auth-button'
)

authButtons.forEach(button => {
  button.addEventListener('click', () => {
    const provider = button.dataset.provider
    const url = `/auth/${provider}`
    const popup = window.open(
      url,
      'OAuthPopup',
      'width=600,height=400'
    )

    // listen for messages from the popup
    window.addEventListener('message', event => {
      if (
        event.origin !== window.location.origin
      ) {
        return
      }

      // close the popup
      popup.close()

      // the event.data is the token
      // we can use it to make requests
      console.log('event.data', event.data)
    })
  })
})
