export const Header = (props, children) => (
  <header>
    <nav>
      <a href='http://localhost:3000'>Home</a>
      <a href={`http://whatever.localhost:3000`}>
        Profile
      </a>
    </nav>
  </header>
)
