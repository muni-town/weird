import db from '../services/db-main.js'

export default {
  name: 'add-create-and-update-times-to-users',
  description: `This migration adds 'created_at' and 'updated_at' columns to the 'weird_users' table.`,

  async up() {
    const [code, data] = await db`
    ALTER TABLE weird_users
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `

    if (code > 0) {
      throw new Error(
        `Error adding created_at and updated_at columns to weird_users table: ${data}`
      )
    }
  },

  async down() {
    const [code, data] = await db`
    ALTER TABLE weird_users
    DROP COLUMN created_at,
    DROP COLUMN updated_at;
  `

    if (code > 0) {
      throw new Error(
        `Error dropping created_at and updated_at columns from weird_users table: ${data}`
      )
    }
  }
}
