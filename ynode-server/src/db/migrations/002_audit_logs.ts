import type Database from 'better-sqlite3';
import { registerMigration } from './index';

registerMigration({
  version: 2,
  name: 'add_audit_logs',

  up: (db: Database.Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                session_id TEXT,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                ip_address TEXT,
                user_agent TEXT,
                request_method TEXT,
                request_path TEXT,
                status_code INTEGER,
                error_message TEXT,
                changes TEXT,
                metadata TEXT,
                created_at TEXT NOT NULL,
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

    db.exec(`
            CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
            CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_logs(ip_address);
            CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_logs(session_id);
        `);
  },

  down: (db: Database.Database) => {
    db.exec(`DROP TABLE IF EXISTS audit_logs`);
  },
});
