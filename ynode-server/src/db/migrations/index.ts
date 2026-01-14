import Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down?: (db: Database.Database) => void;
}

const migrations: Migration[] = [];

export function registerMigration(migration: Migration): void {
  migrations.push(migration);
  migrations.sort((a, b) => a.version - b.version);
}

export function runMigrations(db: Database.Database): void {
  db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            executed_at TEXT NOT NULL
        )
    `);

  const lastMigration = db
    .prepare(
      `
        SELECT version FROM migrations ORDER BY version DESC LIMIT 1
    `
    )
    .get() as { version: number } | undefined;

  const lastVersion = lastMigration?.version ?? 0;

  const pending = migrations.filter((m) => m.version > lastVersion);

  if (pending.length === 0) {
    console.log('✓ Database schema is up to date');
    return;
  }

  console.log(`Running ${pending.length} pending migrations...`);

  for (const migration of pending) {
    console.log(`  → Migration ${migration.version}: ${migration.name}`);

    try {
      db.transaction(() => {
        migration.up(db);

        db.prepare(
          `
                    INSERT INTO migrations (version, name, executed_at)
                    VALUES (?, ?, ?)
                `
        ).run(migration.version, migration.name, new Date().toISOString());
      })();

      console.log(`    ✓ Completed`);
    } catch (error) {
      console.error(`    ✗ Failed:`, error);
      throw error;
    }
  }

  console.log(`✓ All migrations completed`);
}

export function rollbackMigration(
  db: Database.Database,
  targetVersion: number
): void {
  const currentVersion = db
    .prepare(
      `
        SELECT version FROM migrations ORDER BY version DESC LIMIT 1
    `
    )
    .get() as { version: number } | undefined;

  if (!currentVersion || currentVersion.version <= targetVersion) {
    console.log('Nothing to rollback');
    return;
  }

  const toRollback = migrations
    .filter(
      (m) => m.version > targetVersion && m.version <= currentVersion.version
    )
    .reverse();

  for (const migration of toRollback) {
    if (!migration.down) {
      throw new Error(
        `Migration ${migration.version} does not support rollback`
      );
    }

    console.log(`  ← Rolling back ${migration.version}: ${migration.name}`);

    db.transaction(() => {
      migration.down!(db);
      db.prepare(`DELETE FROM migrations WHERE version = ?`).run(
        migration.version
      );
    })();
  }
}

export { migrations };
