export default () => (
  <main>
    <form
      action='create-account'
      method='post'
    >
      <label for='username'>Username:</label>
      <input
        type='text'
        id='username'
        name='username'
      />
      <br />
      <label for='email'>Email:</label>
      <input
        type='email'
        id='email'
        name='email'
      />
      <br />
      <label for='password'>Password:</label>
      <input
        type='password'
        id='password'
        name='password'
      />
      <br />
      <button type='submit'>
        Create Account
      </button>
    </form>

    <h1>Weird.inc index</h1>
    <p>Welcome to the index page</p>
  </main>
)
