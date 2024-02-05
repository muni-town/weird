export default (fn, delay = 100) => {
  let timeoutId

  return function (...args) {
    clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}
