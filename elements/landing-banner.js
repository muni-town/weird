export const LandingBanner = (
  props,
  children
) => (
  <>
    <div class='landing-form'>
      <div>
        <form action='/actions/create-account'>
          <input
            type='text'
            name='username'
            placeholder='Username'
          />
          <span>.weird.one</span>
        </form>
      </div>
    </div>

    {css`
      .landing-form {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #f8f8f8;
      }
    `}
  </>
)
