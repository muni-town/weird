import { oAuthClients } from '../services/oauth-clients.js'
import db from '../services/db-main.js'

const matches = ['/callbacks/:provider']

const handler = async context => {
  const { req, res, queryParams, session } =
    context
  const { code } = queryParams

  console.log('query', queryParams)

  const { url } = req

  console.log('url', url)

  const provider = url
    .split('?')[0]
    .split('/')
    .pop()

  const client = oAuthClients[provider]

  const { access_token } =
    await client.getAccessToken(code)

  // console.log('token', token)

  // const authUrl = client.getAutherizationUrl()

  const user = await client.getUser(access_token)

  const { userId } = session

  console.log('xxuser', session)

  if (provider === 'github') {
    await addGithubUserData({
      weirdUserId: userId,
      user
    })
  }

  return client ? (
    <HttpResponse res={res}>
      {/* {JSON.stringify(user)} */}
      <script>
        {`
        window.opener.postMessage(
          {
            type: 'oauth-callback',
            provider: '${provider}',
            user: ${JSON.stringify(user)}
          },
          window.location.origin
        )
       // window.close()
      `}
      </script>
    </HttpResponse>
  ) : (
    <HttpResponse
      res={res}
      status={404}
      headers={{ 'Content-Type': 'text/plain' }}
    >
      Not found
    </HttpResponse>
  )
}

async function addGithubUserData({
  weirdUserId,
  user
}) {
  console.log('user', { user })

  // check if any user values are undefined
  for (const [key, value] of Object.entries(
    user
  )) {
    console.log('key', key, typeof value, value)
    // check for null objects
    if (value === null) {
      // fix null objects
      //  user[key] = ''
    }
  }

  console.log(`jjjjjjjjj ${weirdUserId},
  ${user.login},
  ${user.id},
  ${user.node_id},
  ${user.avatar_url},
  ${user.gravatar_id},
  ${user.url},
  ${user.html_url},
  ${user.followers_url},
  ${user.following_url},
  ${user.gists_url},
  ${user.starred_url},
  ${user.subscriptions_url},
  ${user.organizations_url},
  ${user.repos_url},
  ${user.events_url},
  ${user.received_events_url},
  ${user.type},
  ${user.site_admin},
  ${user.name},
  ${user.company},
  ${user.blog},
  ${user.location},
  ${user.email},
  ${user.hireable},
  ${user.bio},
  ${user.twitter_username},
  ${user.public_repos},
  ${user.public_gists},
  ${user.followers},
  ${user.following},
  ${user.created_at},
  ${user.updated_at}`)

  // shcema
  //   CREATE TABLE github_user_data (
  //     login VARCHAR(255),
  //     id VARCHAR(8) PRIMARY KEY,
  //     node_id VARCHAR(30),
  //     weird_user_id VARCHAR(7) REFERENCES weird_users(weird_user_id) ON DELETE CASCADE,
  //     avatar_url TEXT,
  //     gravatar_id VARCHAR(255),
  //     url TEXT,
  //     html_url TEXT,
  //     followers_url TEXT,
  //     following_url TEXT,
  //     gists_url TEXT,
  //     starred_url TEXT,
  //     subscriptions_url TEXT,
  //     organizations_url TEXT,
  //     repos_url TEXT,
  //     events_url TEXT,
  //     received_events_url TEXT,
  //     type VARCHAR(255),
  //     site_admin BOOLEAN,
  //     name VARCHAR(255),
  //     company VARCHAR(255),
  //     blog TEXT,
  //     location VARCHAR(255),
  //     email VARCHAR(255),
  //     hireable BOOLEAN,
  //     bio TEXT,
  //     twitter_username VARCHAR(255),
  //     public_repos INTEGER,
  //     public_gists INTEGER,
  //     followers INTEGER,
  //     following INTEGER,
  //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  // );

  // example user:
  // {
  //   "login": "wahtever",
  //   "id": 33972521,
  //   "node_id": "MDQ6VXNlcjMzOTcyNTIx",
  //   "avatar_url": "https://avatars.githubusercontent.com/u/33972521?v=4",
  //   "gravatar_id": "",
  //   "url": "https://api.github.com/users/wahtever",
  //   "html_url": "https://github.com/wahtever",
  //   "followers_url": "https://api.github.com/users/wahtever/followers",
  //   "following_url": "https://api.github.com/users/wahtever/following{/other_user}",
  //   "gists_url": "https://api.github.com/users/wahtever/gists{/gist_id}",
  //   "starred_url": "https://api.github.com/users/wahtever/starred{/owner}{/repo}",
  //   "subscriptions_url": "https://api.github.com/users/wahtever/subscriptions",
  //   "organizations_url": "https://api.github.com/users/wahtever/orgs",
  //   "repos_url": "https://api.github.com/users/wahtever/repos",
  //   "events_url": "https://api.github.com/users/wahtever/events{/privacy}",
  //   "received_events_url": "https://api.github.com/users/wahtever/received_events",
  //   "type": "User",
  //   "site_admin": false,
  //   "name": "whateever name",
  //   "company": null,
  //   "blog": "",
  //   "location": null,
  //   "email": null,
  //   "hireable": null,
  //   "bio": null,
  //   "twitter_username": null,
  //   "public_repos": 50,
  //   "public_gists": 0,
  //   "followers": 18,
  //   "following": 5,
  //   "created_at": "2017-11-25T03:07:01Z",
  //   "updated_at": "2024-01-29T10:51:34Z"
  // }

  // insert
  const [code, data] = await db`
INSERT INTO github_user_data (
  weird_user_id,
  login,
  id,
  node_id,
  avatar_url,
  gravatar_id,
  url,
  html_url,
  followers_url,
  following_url,
  gists_url,
  starred_url,
  subscriptions_url,
  organizations_url,
  repos_url,
  events_url,
  received_events_url,
  type,
  site_admin,
  name,
  company,
  blog,
  location,
  email,
  hireable,
  bio,
  twitter_username,
  public_repos,
  public_gists,
  followers,
  following,
  created_at,
  updated_at
) VALUES (
  ${weirdUserId},
  ${user.login},
  ${user.id},
  ${user.node_id},
  ${user.avatar_url},
  ${user.gravatar_id},
  ${user.url},
  ${user.html_url},
  ${user.followers_url},
  ${user.following_url},
  ${user.gists_url},
  ${user.starred_url},
  ${user.subscriptions_url},
  ${user.organizations_url},
  ${user.repos_url},
  ${user.events_url},
  ${user.received_events_url},
  ${user.type},
  ${user.site_admin},
  ${user.name},
  ${user.company},
  ${user.blog},
  ${user.location},
  ${user.email},
  ${user.hireable},
  ${user.bio},
  ${user.twitter_username},
  ${user.public_repos},
  ${user.public_gists},
  ${user.followers},
  ${user.following},
  ${user.created_at},
  ${user.updated_at}
)
`
  if (code > 0) {
    console.error(
      `Error adding github user data: ${data}`
    )
    throw new Error(
      `Error adding github user data: ${data}`
    )
  }
}

export { handler, matches }
