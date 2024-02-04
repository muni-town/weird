import profileRoute from '../routes/profile.js'

export default host => {
  // TODO: subdomain matching beyond user profiles for stuff like CDN and email

  let route

  route = profileRoute

  return route
}
