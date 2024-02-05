import { transform as _transform } from '@babel/core'

export default function transform(fileContents) {
  const { code } = _transform(fileContents, {})

  return code
}
