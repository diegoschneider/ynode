import type Database from 'better-sqlite3';
import { registerMigration } from './index';

registerMigration({
  version: 3,
  name: 'add_sessions',

  up: (db: Database.Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                refresh_token_hash TEXT,
                ip_address TEXT,
                user_agent TEXT,
                device_fingerprint TEXT,
                created_at TEXT NOT NULL,
                last_active_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                is_revoked INTEGER DEFAULT 0,
                revoked_at TEXT,
                revoked_reason TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

    db.exec(`
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
            CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
            CREATE INDEX IF NOT EXISTS idx_sessions_is_revoked ON sessions(is_revoked);
        `);
  },

  down: (db: Database.Database) => {
    db.exec(`DROP TABLE IF EXISTS sessions`);
  },
});
