import { env as _env } from 'node:process'

const baseURL = () => {
  const { WEIRD_HOST, WEIRD_PORT, WEIRD_TLD } =
    _env

  return `${WEIRD_HOST}${WEIRD_TLD}${WEIRD_PORT}`
}

const baseURLWithProtocol = () => {
  const { WEIRD_PROTOCOL } = _env

  return `${WEIRD_PROTOCOL}://${baseURL()}`
}

_env.BASE_URL = baseURL()
_env.BASE_URL_WITH_PROTOCOL =
  baseURLWithProtocol()

export default _env
