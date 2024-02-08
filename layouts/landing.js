export default () => (
  <main>
    <Style />
    <h1>Weird.inc index</h1>
    <p>Welcome to the index page</p>
    <img
      src='https://placekitten.com/200/300'
      alt='A cute kitten'
    />
    <form
      action='/actions/create-account'
      method='post'
    >
      <div class='username-container'>
        <input
          placeholder='username'
          class='username-input'
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
      body {
        background-color: red;
      }

      .username-container {
        background: rgb(255, 255, 255);
        display: inline-grid;
        grid-auto-flow: column;
        place-items: start stretch;
        grid-auto-columns: max-content;
        grid-auto-rows: min-content;
      }

      .username-input {
        border: 0px;
      }
    `}</style>
  )
}
