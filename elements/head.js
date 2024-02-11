export default (props, children) => (
  <head>
    <meta charSet='utf-8' />
    <meta
      name='viewport'
      content='width=device-width, initial-scale=1'
    />
    <title>Weird.inc</title>
    <Style />
    {children}
  </head>
)

function Style() {
  return (
    <style>
      {css`
        *,
        *::before,
        ::after {
          padding: 0;
          margin: 0;
        }

        html {
          font-size: 100%;
          font-family: Avenir, Montserrat, Corbel,
            'URW Gothic', source-sans-pro,
            sans-serif;
          font-weight: normal;
          box-sizing: border-box;
          scroll-behavior: smooth;
          /*scroll gutter */
          scrollbar-gutter: stable both-edges;
        }

        body {
          text-align: center;
          background: #f8f8f8;
        }
      `}
    </style>
  )
}
