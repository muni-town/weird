import db from '../services/db-main.js'

export default {
  name: 'create-github-users-data-table',
  description:
    'This migration creates the github_users_data table which will store the data of the users from github social login. We link the users via the weird_id in the weird_users table.',

  async up() {
    await db`
    CREATE TABLE github_user_data (
      id SERIAL PRIMARY KEY,
      weird_user_id INTEGER REFERENCES weird_users(weird_id) ON DELETE CASCADE,
      github_id INTEGER,
      login VARCHAR(255),
      avatar_url VARCHAR(255),
      html_url VARCHAR(255),
      followers_url VARCHAR(255),
      following_url VARCHAR(255),
      gists_url VARCHAR(255),
      starred_url VARCHAR(255),
      subscriptions_url VARCHAR(255),
      organizations_url VARCHAR(255),
      repos_url VARCHAR(255),
      events_url VARCHAR(255),
      received_events_url VARCHAR(255),
      user_type VARCHAR(50),
      site_admin BOOLEAN,
      name VARCHAR(255),
      company VARCHAR(255),
      blog VARCHAR(255),
      location VARCHAR(255),
      email VARCHAR(255),
      hireable BOOLEAN,
      bio TEXT,
      twitter_username VARCHAR(255),
      public_repos INTEGER,
      public_gists INTEGER,
      followers INTEGER,
      following INTEGER,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
  );
    `
  },

  async down() {
    await db`
    DROP TABLE github_user_data;
    `
  }
}
