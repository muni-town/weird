import SELF_CLOSING_TAGS from './consts/self-closing-html-tags.js'

import { URLPattern } from 'urlpattern-polyfill'
globalThis.URLPattern = URLPattern

globalThis.css = function (strings, ...values) {
  // return <style> tag with interpolated styles

  const interpolated = strings
    .map((string, i) => {
      const value = values[i] || ''
      return string + value
    })
    .join('')

  return <style>{interpolated}</style>
}

globalThis.JSXToString = function (
  tag,
  props,
  ...children
) {
  if (tag === 'JSXFragmentToString') {
    return children.filter(Boolean).join('')
  }

  if (typeof tag === 'function') {
    const result = tag(props, children)

    return Array.isArray(result)
      ? result.filter(Boolean).join('')
      : result
  }

  // handle forms
  if (tag === 'form') {
    if (props.action) {
      props.action = `/actions/${props.action}`
    }
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
    .filter(Boolean)
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

globalThis.HttpResponse = (
  { res, status, headers = {} },
  children
) => {
  if (res.headersSent) {
    console.trace(
      'Response headers already sent.'
    )
    // return
  }

  // if it has children, we should assume it's HTML so set the content type
  if (children.length) {
    headers['Content-Type'] = 'text/html'
  }

  res.writeHead(status, headers)

  // if 302
  if (status === 302) {
    res.end()
    return
  }

  const childrenString = children.map(child => {
    if (typeof child === 'object') {
      return JSON.stringify(child)
    }

    return child
  })

  res.end(childrenString.join(''))
}

import {
  runMigrations,
  ensureMigrationTableExists
} from './services/migrations.js'

await ensureMigrationTableExists()
await runMigrations()
