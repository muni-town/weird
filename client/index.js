console.log('hello from client/index.js!')

navigation.addEventListener('navigate', event => {
  // Exit early if this navigation shouldn't be intercepted,
  // e.g. if the navigation is cross-origin, or a download request
  //   if (shouldNotIntercept(event)) {
  //   //  return
  //   }

  console.log(event)

  const hasFormData = event.formData

  if (hasFormData) {
    // Intercept the request and handle it ourselves
    // const formData = new FormData(event.formData)
    console.log({ formData: event.formData })

    // loop through formData.entries()
    event.formData.forEach((value, key) => {
      console.log({ key, value })
    })

    event.intercept({
      async handler() {
        const action = event.formData.get(
          'form-action'
        )
        const validationUrl = event.formData.get(
          'data-validate'
        )
        const selector = `form[data-action="${action}"]`

        const form =
          document.querySelector(selector)

        console.log({
          action,
          validationUrl,
          selector,
          form
        })
        // send a fetch request with the form data
        const response = await fetch(
          event.destination.url,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'multipart/form-data',
              'Accept': 'text/html-fragment'
            },
            body: event.formData
          }
        )
        // return the response

        const headers = response.headers

        // if redirect, follow the redirect
        if (response.redirected) {
          const url = new URL(response.url)

          window.location.href = url
          return
        }

        const body = await response.text()

        const hasValidationErrors = headers.get(
          'x-has-validation-error'
        )

        if (hasValidationErrors) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(
            body,
            'text/html'
          )

          const newForm =
            doc.querySelector(selector)

          form.replaceWith(newForm)

          // show the error to the user
          return
        }

        const parser = new DOMParser()
        const doc = parser.parseFromString(
          body,
          'text/html'
        )

        const newScripts =
          doc.querySelectorAll('script')

        newScripts.forEach(script =>
          script.replaceWith(script)
        )

        const newHead = doc.querySelector('head')
        const newBody = doc.querySelector('body')

        const oldHead =
          document.querySelector('head')
        const oldBody =
          document.querySelector('body')

        oldHead.replaceWith(newHead)
        oldBody.replaceWith(newBody)

        console.log({ body, headers })

        // reload the scripts
        newScripts.forEach(script => {
          const newScript =
            document.createElement('script')

          newScript.src = script.src
          document.head.appendChild(newScript)
        })
      }
    })
  }

  const url = new URL(event.destination.url)
})

function shouldNotIntercept(event) {
  console.log(event)
  return false
}
