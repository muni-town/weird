export default () => (
  <main>
    <Style />
    <h1>Weird.inc index</h1>
    <p>Welcome to the index page</p>

    <form
      action='/actions/create-account'
      method='post'
      enctype='application/x-www-form-urlencoded'
      class='create-account-form'
    >
      <div class='container'>
        <input
          placeholder='username'
          class='input'
          name='username'
        />
        {/*honeypot*/}
        <input
          type='hidden'
          name='honeypot'
          value=''
        />
        <p>.weird.one</p>
      </div>
      <button type='submit'>
        Create your page!
      </button>
    </form>
  </main>
)

function Style() {
  return (
    <style>{css`
      .create-account-form {
        .container {
          background: rgb(255, 255, 255);
          display: inline-grid;
          grid-auto-flow: column;
          place-items: start stretch;
          grid-auto-columns: max-content;
          grid-auto-rows: min-content;
        }

        .input {
          border: 0px;
        }
      }
    `}</style>
  )
}
