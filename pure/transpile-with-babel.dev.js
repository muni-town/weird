import { transform } from '@babel/core'

export default function transpileWithBabel(
  fileContents
) {
  const { code } = transform(fileContents, {})

  return code
}
