import { transform as _transform } from '@babel/core'

export default fileContents => {
  const { code } = _transform(fileContents, {
    plugins: [
      [
        '@babel/plugin-transform-react-jsx',
        {
          // jsxImportSource: 'custom-jsx-runtime',
          runtime: 'classic',
          throwIfNamespace: false,
          pragma: 'JSXToString',
          pragmaFrag: 'JSXFragmentToString'
        }
      ]
    ]
  })

  return code
}
