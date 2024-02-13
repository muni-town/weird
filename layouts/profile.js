export default ({ username }) => (
  <>
    <main>
      <header>
        <img
          src={`https://api.dicebear.com/7.x/croodles/svg?seed=${username}`}
          alt='Linktree photo'
        />
        <h3>{username}</h3>
        <span>Frontend software engineer</span>
      </header>
      <nav class='linktree-nav'>
        <ul>
          <li>
            <a href='#'>
              <div class='linktree-box'>
                <div
                  class='icon-box'
                  style='--color: 195, 53%, 79%'
                >
                  🌐
                </div>
                <div>
                  <h5>Portfolio</h5>
                  <span>Find me on the web</span>
                </div>
              </div>
            </a>
          </li>
          <li>
            <a href='#'>
              <div class='linktree-box'>
                <div
                  class='icon-box'
                  style='--color: 0, 100%, 50%'
                >
                  ❤
                </div>
                <div>
                  <h5>Twitter</h5>
                  <span>Connect with me</span>
                </div>
              </div>
            </a>
          </li>
          <li>
            <a href='#'>
              <div class='linktree-box'>
                <div
                  class='icon-box'
                  style='--color: 44, 100%, 53%'
                >
                  ⚡
                </div>
                <div>
                  <h5>Codepen</h5>
                  <span>See my demos </span>
                </div>
              </div>
            </a>
          </li>
          <li>
            <a href='#'>
              <div
                class='linktree-box'
                style='--color: 110, 91%, 40%'
              >
                <div class='icon-box'>👨🏾‍💻</div>
                <div>
                  <h5>LinkedIn</h5>
                  <span>Let's work</span>
                </div>
              </div>
            </a>
          </li>
        </ul>
      </nav>
    </main>

    {css`
      main {
        padding: 12vh 0;
      }

      img[alt='Linktree photo'] {
        --scale: 164px;
        width: var(--scale);
        height: var(--scale);
        border-radius: 24px;

        + h3 {
          margin: 16px 0 0px;
        }
      }

      .linktree-nav {
        margin: 40px auto 0;
        width: 95%;
        max-width: 700px;

        ul {
          display: grid;
          gap: 1rem;
          list-style: none;

          @media (min-width: 600px) {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        a {
          text-decoration: none;
          color: inherit;
        }
      }

      .linktree-box {
        display: flex;
        align-items: center;
        text-align: start;
        padding: 12px 12px;
        border: 1px solid #ebebeb;
        border-radius: 8px;
        background: #fff;

        .icon-box {
          --scale: 56px;
          width: var(--scale);
          height: var(--scale);
          font-size: 1.25rem;
          background: hsl(var(--color), 30%);
          color: hsl(var(--color));
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          margin-right: 16px;
        }
      }
    `}
  </>
)
