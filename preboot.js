globalThis.JSXToString = function (
  tag,
  props,
  ...children
) {
  if (tag === 'JSXFragmentToString') {
    return children.join('')
  }

  if (typeof tag === 'function') {
    return tag(props, children)
  }

  const attrs = props
    ? Object.entries(props)
        .map(
          ([key, value]) => `${key}="${value}"`
        )
        .join(' ')
    : ''
  const childrenString = children.join('')
  return `<${tag}${attrs}>${childrenString}</${tag}>`
}

globalThis.JSXFragmentToString = function (
  ...children
) {
  return children.join('')
}
