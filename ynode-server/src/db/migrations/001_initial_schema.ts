import type Database from 'better-sqlite3';
import { registerMigration } from './index';

registerMigration({
  version: 1,
  name: 'initial_schema',

  up: (db: Database.Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT,
                executions_this_month INTEGER DEFAULT 0,
                last_reset_at TEXT NOT NULL,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TEXT,
                password_changed_at TEXT,
                must_change_password INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

    db.exec(`
            CREATE TABLE IF NOT EXISTS workflows (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                nodes TEXT NOT NULL,
                edges TEXT NOT NULL,
                settings TEXT,
                is_active INTEGER DEFAULT 1,
                is_deleted INTEGER DEFAULT 0,
                deleted_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

    db.exec(`
            CREATE TABLE IF NOT EXISTS executions (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'cancelled')),
                trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'webhook', 'schedule', 'api')),
                logs TEXT,
                error_message TEXT,
                duration_ms INTEGER,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

    db.exec(`
            CREATE TABLE IF NOT EXISTS webhooks (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                path TEXT NOT NULL,
                method TEXT DEFAULT 'POST',
                secret_hash TEXT,
                is_active INTEGER DEFAULT 1,
                last_triggered_at TEXT,
                trigger_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
            )
        `);

    db.exec(`
            CREATE TABLE IF NOT EXISTS schedules (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                cron_expression TEXT NOT NULL,
                timezone TEXT DEFAULT 'UTC',
                next_run_at TEXT,
                last_run_at TEXT,
                is_active INTEGER DEFAULT 1,
                run_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
            )
        `);

    db.exec(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
            CREATE INDEX IF NOT EXISTS idx_workflows_is_deleted ON workflows(is_deleted);
            CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_executions_user_id ON executions(user_id);
            CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
            CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at DESC);
            CREATE INDEX IF NOT EXISTS idx_webhooks_workflow_id ON webhooks(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_webhooks_path ON webhooks(path);
            CREATE INDEX IF NOT EXISTS idx_schedules_workflow_id ON schedules(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON schedules(next_run_at);
        `);
  },

  down: (db: Database.Database) => {
    db.exec(`
            DROP TABLE IF EXISTS schedules;
            DROP TABLE IF EXISTS webhooks;
            DROP TABLE IF EXISTS executions;
            DROP TABLE IF EXISTS workflows;
            DROP TABLE IF EXISTS users;
        `);
  },
});
