import env from './env.js'

const {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  LINKEDIN_OAUTH_CLIENT_ID,
  LINKEDIN_OAUTH_CLIENT_SECRET,
  GITHUB_OAUTH_CLIENT_ID,
  GITHUB_OAUTH_CLIENT_SECRET,
  DISCORD_OAUTH_CLIENT_ID,
  DISCORD_OAUTH_CLIENT_SECRET
} = env

const HOST = 'http://localhost:3000'
const GRANT_TYPE = 'authorization_code'

export default {
  google: {
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: `${HOST}/callbacks/google`,
    TOKEN_URL:
      'https://oauth2.googleapis.com/token',
    TOKEN_REQUEST_ENCODING:
      'application/x-www-form-urlencoded',
    AUTHORIZE_URL:
      'https://accounts.google.com/o/oauth2/auth',
    USER_URL:
      'https://www.googleapis.com/oauth2/v1/userinfo',
    scope: ['openid', 'profile', 'email'],
    grant_type: GRANT_TYPE
  },
  linkedin: {
    client_id: LINKEDIN_OAUTH_CLIENT_ID,
    client_secret: LINKEDIN_OAUTH_CLIENT_SECRET,
    redirect_uri: `${HOST}/callbacks/linkedin`,
    TOKEN_URL:
      'https://www.linkedin.com/oauth/v2/accessToken',
    TOKEN_REQUEST_ENCODING:
      'application/x-www-form-urlencoded',
    AUTHORIZE_URL:
      'https://www.linkedin.com/oauth/v2/authorization',
    USER_URL:
      'https://api.linkedin.com/v2/userinfo',
    scope: ['openid', 'profile', 'email'],
    grant_type: GRANT_TYPE
  },
  github: {
    client_id: GITHUB_OAUTH_CLIENT_ID,
    client_secret: GITHUB_OAUTH_CLIENT_SECRET,
    redirect_uri: `${HOST}/callbacks/github`,
    TOKEN_URL:
      'https://github.com/login/oauth/access_token',
    TOKEN_REQUEST_ENCODING: 'application/json',
    AUTHORIZE_URL:
      'https://github.com/login/oauth/authorize',
    USER_URL: 'https://api.github.com/user',
    scope: [],
    grant_type: GRANT_TYPE
  },
  discord: {
    client_id: DISCORD_OAUTH_CLIENT_ID,
    client_secret: DISCORD_OAUTH_CLIENT_SECRET,
    redirect_uri: `${HOST}/callbacks/discord`,
    TOKEN_URL:
      'https://discord.com/api/oauth2/token',
    TOKEN_REQUEST_ENCODING:
      'application/x-www-form-urlencoded',
    AUTHORIZE_URL:
      'https://discord.com/api/oauth2/authorize',
    USER_URL: 'https://discord.com/api/users/@me',
    scope: ['identify', 'email'],
    grant_type: GRANT_TYPE
  }
}
