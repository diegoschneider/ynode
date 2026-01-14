import type Database from 'better-sqlite3';
import { registerMigration } from './index';

registerMigration({
  version: 5,
  name: 'add_password_history',

  up: (db: Database.Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS password_history (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

    db.exec(`
            CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
            CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at DESC);
        `);
  },

  down: (db: Database.Database) => {
    db.exec(`DROP TABLE IF EXISTS password_history`);
  },
});
