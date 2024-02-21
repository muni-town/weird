import Document from '../layouts/document.js'

export const handler = context => {
  const { res } = context

  return (
    <HttpResponse res={res}>
      <Document>
        <script src='/account-linking.js'></script>
        <h2>
          you went through the email link stuff
          and land here
        </h2>

        {[
          'github',
          'google',
          'discord',
          'mastodon'
        ].map(provider => (
          <button
            data-provider={provider}
            class='provider-auth-button'
          >
            link {provider}
          </button>
        ))}
      </Document>
    </HttpResponse>
  )
}
