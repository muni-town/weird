import db from '../services/db-main.js'

export default {
  name: 'create-weird-users-table',
  description: `This migration creates a table to store weird users. Each user has a username, email, password, and a weird-id as a unique identifier.`,

  async up() {
    await db`
      CREATE TABLE weird_users (
          id VARCHAR(7) PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          weird_id VARCHAR(10) NOT NULL
      );
    `
  },

  async down() {
    await db`
      DROP TABLE IF EXISTS weird_users;
    `
  }
}
