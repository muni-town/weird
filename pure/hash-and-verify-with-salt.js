import { default as _bcrypt } from 'bcrypt'

const SALT_ROUNDS = 12

const randomDelay = () =>
  new Promise(resolve =>
    setTimeout(resolve, Math.random() * 1000)
  )

const hash = async password => {
  await randomDelay()
  const hashedPassword = await _bcrypt.hash(
    password,
    SALT_ROUNDS
  )

  return hashedPassword
}

const verify = async (
  password,
  hashedPassword
) => {
  await randomDelay()
  const isMatch = await _bcrypt.compare(
    password,
    hashedPassword
  )

  return isMatch
}

export { hash, verify }
