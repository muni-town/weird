import { transform as _transform } from '@babel/core'

export default function transform(fileContents) {
  const { code } = _transform(fileContents, {
    plugins: [
      [
        '@babel/plugin-transform-react-jsx',
        {
          pragma: 'JSXToString',
          pragmaFrag: 'JSXFragmentToString',
          throwIfNamespace: false
        }
      ]
    ]
  })

  return code
}
