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
      <input
        type='text'
        name='email'
        placeholder='email'
      />
      <input
        type='password'
        name='password'
        placeholder='password'
      />
      <button type='submit'>
        Create account
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
    `}</style>
  )
}
