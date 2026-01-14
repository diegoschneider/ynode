import { db } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export interface MemoryRow {
  id: string;
  workflow_id: string;
  node_id: string | null;
  key: string;
  value: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function getMemory(
  workflowId: string,
  nodeId: string | null,
  key: string
): unknown | null {
  const row = db
    .prepare(
      `
        SELECT value, expires_at FROM workflow_memory 
        WHERE workflow_id = ? AND COALESCE(node_id, '') = ? AND key = ?
    `
    )
    .get(workflowId, nodeId || '', key) as
    | { value: string; expires_at: string | null }
    | undefined;

  if (!row) return null;

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    deleteMemory(workflowId, nodeId, key);
    return null;
  }

  return JSON.parse(row.value);
}

export function setMemory(
  workflowId: string,
  nodeId: string | null,
  key: string,
  value: unknown,
  ttlSeconds?: number
): void {
  const now = new Date().toISOString();
  const expiresAt = ttlSeconds
    ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
    : null;
  const jsonValue = JSON.stringify(value);

  db.prepare(
    `
        INSERT INTO workflow_memory (id, workflow_id, node_id, key, value, expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(workflow_id, COALESCE(node_id, ''), key) 
        DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at, updated_at = excluded.updated_at
    `
  ).run(uuidv4(), workflowId, nodeId, key, jsonValue, expiresAt, now, now);
}

export function deleteMemory(
  workflowId: string,
  nodeId: string | null,
  key: string
): boolean {
  const result = db
    .prepare(
      `
        DELETE FROM workflow_memory 
        WHERE workflow_id = ? AND COALESCE(node_id, '') = ? AND key = ?
    `
    )
    .run(workflowId, nodeId || '', key);

  return result.changes > 0;
}

export function listMemoryKeys(
  workflowId: string,
  nodeId: string | null
): string[] {
  const rows = db
    .prepare(
      `
        SELECT key FROM workflow_memory 
        WHERE workflow_id = ? AND COALESCE(node_id, '') = ?
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `
    )
    .all(workflowId, nodeId || '') as { key: string }[];

  return rows.map((r) => r.key);
}

export function clearWorkflowMemory(workflowId: string): number {
  const result = db
    .prepare(
      `
        DELETE FROM workflow_memory WHERE workflow_id = ?
    `
    )
    .run(workflowId);

  return result.changes;
}

export function clearNodeMemory(workflowId: string, nodeId: string): number {
  const result = db
    .prepare(
      `
        DELETE FROM workflow_memory WHERE workflow_id = ? AND node_id = ?
    `
    )
    .run(workflowId, nodeId);

  return result.changes;
}

export function cleanupExpiredMemory(): number {
  const result = db
    .prepare(
      `
        DELETE FROM workflow_memory WHERE expires_at < datetime('now')
    `
    )
    .run();

  return result.changes;
}

export function createMemoryAPI(workflowId: string, nodeId: string | null) {
  return {
    get: async (key: string): Promise<unknown> => {
      return getMemory(workflowId, nodeId, key);
    },
    set: async (key: string, value: unknown, ttl?: number): Promise<void> => {
      setMemory(workflowId, nodeId, key, value, ttl);
    },
    delete: async (key: string): Promise<void> => {
      deleteMemory(workflowId, nodeId, key);
    },
    list: async (): Promise<string[]> => {
      return listMemoryKeys(workflowId, nodeId);
    },
  };
}
