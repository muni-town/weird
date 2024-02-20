import db from '../services/db-main.js'

// {
//   "weird_user_id": "u-37fsc", // reference to weird_users table on the weird_user_id column
//   "login": "wahtever",
//   "id": 33972521, // primary key
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

export default {
  name: 'create-github-users-data-table',
  description:
    'This migration creates the github_users_data table which will store the data of the users from github social login. We link the users via the weird_id in the weird_users table.',

  async up() {
    const [code, data] = await db`
    CREATE TABLE github_user_data (
      weird_user_id VARCHAR(7) REFERENCES weird_users(weird_user_id),
      login VARCHAR(255) NOT NULL,
      id BIGINT PRIMARY KEY,
      node_id VARCHAR(255) NOT NULL,
      avatar_url VARCHAR(255) NOT NULL,
      gravatar_id VARCHAR(255) NOT NULL,
      url VARCHAR(255) NOT NULL,
      html_url VARCHAR(255) NOT NULL,
      followers_url VARCHAR(255) NOT NULL,
      following_url VARCHAR(255) NOT NULL,
      gists_url VARCHAR(255) NOT NULL,
      starred_url VARCHAR(255) NOT NULL,
      subscriptions_url VARCHAR(255) NOT NULL,
      organizations_url VARCHAR(255) NOT NULL,
      repos_url VARCHAR(255) NOT NULL,
      events_url VARCHAR(255) NOT NULL,
      received_events_url VARCHAR(255) NOT NULL,
      type VARCHAR(255) NOT NULL,
      site_admin BOOLEAN NOT NULL,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      blog VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      email VARCHAR(255),
      hireable BOOLEAN,
      bio VARCHAR(255),
      twitter_username VARCHAR(255),
      public_repos BIGINT NOT NULL,
      public_gists BIGINT NOT NULL,
      followers BIGINT NOT NULL,
      following BIGINT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
  );
    `

    if (code > 0) {
      throw new Error(
        `Error creating github_user_data table: ${data}`
      )
    }
  },

  async down() {
    const [code, data] = await db`
   DROP TABLE github_user_data;
   `

    if (code > 0) {
      throw new Error(
        `Error dropping github_user_data table: ${data}`
      )
    }
  }
}

// example insert
// const [code, data] = await db`
// INSERT INTO github_user_data (
//   weird_user_id,
//   login,
//   id,
//   node_id,
//   avatar_url,
//   gravatar_id,
//   url,
//   html_url,
//   followers_url,
//   following_url,
//   gists_url,
//   starred_url,
//   subscriptions_url,
//   organizations_url,
//   repos_url,
//   events_url,
//   received_events_url,
//   type,
//   site_admin,
//   name,
//   company,
//   blog,
//   location,
//   email,
//   hireable,
//   bio,
//   twitter_username,
//   public_repos,
//   public_gists,
//   followers,
//   following,
//   created_at,
//   updated_at
// ) VALUES (
//   ${user.weird_user_id},
//   ${user.login},
//   ${user.id},
//   ${user.node_id},
//   ${user.avatar_url},
//   ${user.gravatar_id},
//   ${user.url},
//   ${user.html_url},
//   ${user.followers_url},
//   ${user.following_url},
//   ${user.gists_url},
//   ${user.starred_url},
//   ${user.subscriptions_url},
//   ${user.organizations_url},
//   ${user.repos_url},
//   ${user.events_url},
//   ${user.received_events_url},
//   ${user.type},
//   ${user.site_admin},
//   ${user.name},
//   ${user.company},
//   ${user.blog},
//   ${user.location},
//   ${user.email},
//   ${user.hireable},
//   ${user.bio},
//   ${user.twitter_username},
//   ${user.public_repos},
//   ${user.public_gists},
//   ${user.followers},
//   ${user.following},
//   ${user.created_at},
//   ${user.updated_at}
// )
// `
