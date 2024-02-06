import SELF_CLOSING_TAGS from './consts/self-closing-html-tags.js'

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

  const childrenString = children
    .map(child => {
      if (Array.isArray(child)) {
        return child.join('')
      } else {
        return child
      }
    })

    .join('')

  if (SELF_CLOSING_TAGS.has(tag)) {
    return `<${tag} ${attrs} />`
  } else {
    return `<${tag} ${attrs}>${childrenString}</${tag}>`
  }
}

globalThis.JSXFragmentToString = function (
  ...children
) {
  return children.filter(Boolean).join('')
}
