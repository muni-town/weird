export default (props, children) => (
  <>
    <form
      action='create-account'
      method='post'
      class='create-account-form'
    >
      <label for='username'>Username</label>
      <input
        type='text'
        id='username'
        name='username'
      />
      <label for='email'>Email</label>
      <input
        type='email'
        id='email'
        name='email'
      />
      <label for='password'>Password</label>
      <input
        type='password'
        id='password'
        name='password'
      />
      <button type='submit'>
        Create Account
      </button>

      {css`
        .create-account-form {
          display: grid;
          background-color: red;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #ccc;

          label {
            display: block;
          }

          input {
            font-size: 1rem;
            padding: 0.5rem;
          }

          button {
            font-size: 1rem;
            padding: 0.5rem 1rem;
            background-color: #f60;
            color: white;
            border: none;
            border-radius: 0.25rem;
          }
        }
      `}
    </form>
  </>
)
