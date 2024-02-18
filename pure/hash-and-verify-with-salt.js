import { default as _bcrypt } from 'bcrypt'

const SALT_ROUNDS = 12
const PEPPER = 'le_pepper'

const randomDelay = () =>
  new Promise(resolve =>
    setTimeout(resolve, Math.random() * 1000)
  )

const hash = async password => {
  await randomDelay()
  const pepperedPassword = password + PEPPER
  const hashedPassword = await _bcrypt.hash(
    pepperedPassword,
    SALT_ROUNDS
  )

  return hashedPassword
}

const verify = async (
  password,
  hashedPassword
) => {
  await randomDelay()
  const pepperedPassword = password + PEPPER
  const isMatch = await _bcrypt.compare(
    pepperedPassword,
    hashedPassword
  )

  return isMatch
}

export { hash, verify }
