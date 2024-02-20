import db from '../services/db-main.js'

export default {
  name: 'create-weird-users-table',
  description: `This migration creates a table to store weird users. Each user has a username, email, password, and a weird-id as a unique identifier.`,

  async up() {
    const [code, data] = await db`
    CREATE TABLE weird_users (
      weird_user_id VARCHAR(7) PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `

    if (code > 0) {
      throw new Error(
        `Error creating weird_users table: ${data}`
      )
    }
  },

  async down() {
    const [code, data] = await db`
    DROP TABLE IF EXISTS weird_users;
  `

    if (code > 0) {
      throw new Error(
        `Error dropping weird_users table: ${data}`
      )
    }
  }
}
