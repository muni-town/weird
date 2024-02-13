import db from '../services/db-main.js'

export default {
  name: 'add-create-and-update-times-to-users',
  description: `This migration adds 'created_at' and 'updated_at' columns to the 'weird_users' table.`,

  async up() {
    await db`
      ALTER TABLE weird_users
      ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `
  },

  async down() {
    await db`
      ALTER TABLE weird_users
      DROP COLUMN created_at,
      DROP COLUMN updated_at;
    `
  }
}
