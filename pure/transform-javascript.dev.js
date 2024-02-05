import { transform as _transform } from '@babel/core'

export default function transform(fileContents) {
  const { code } = _transform(fileContents, {
    plugins: [
      [
        '@babel/plugin-transform-react-jsx',
        {
          jsxImportSource: 'custom-jsx-runtime',
          runtime: 'classic',
          throwIfNamespace: false
        }
        // {
        //   runtime: 'automatic',
        //   jsxImportSource: './pure'
        // }
      ]
    ]
  })

  return code
}
