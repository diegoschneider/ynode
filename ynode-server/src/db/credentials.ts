import { db } from './index.js';
import { v4 as uuidv4 } from 'uuid';
import { encryptCredential, decryptCredential } from '../services/crypto.js';

export interface CredentialRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

export interface CredentialInput {
  name: string;
  type: string;
  data: Record<string, string>;
}

export function createCredential(
  userId: string,
  input: CredentialInput
): CredentialRow {
  const id = uuidv4();
  const now = new Date().toISOString();
  const encryptedData = encryptCredential(JSON.stringify(input.data));

  db.prepare(
    `
        INSERT INTO credentials (id, user_id, name, type, encrypted_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  ).run(id, userId, input.name, input.type, encryptedData, now, now);

  return {
    id,
    user_id: userId,
    name: input.name,
    type: input.type,
    encrypted_data: encryptedData,
    created_at: now,
    updated_at: now,
  };
}

export function getCredentialsByUserId(
  userId: string
): Omit<CredentialRow, 'encrypted_data'>[] {
  return db
    .prepare(
      `
        SELECT id, user_id, name, type, created_at, updated_at 
        FROM credentials 
        WHERE user_id = ?
        ORDER BY created_at DESC
    `
    )
    .all(userId) as Omit<CredentialRow, 'encrypted_data'>[];
}

export function getCredentialById(id: string): CredentialRow | undefined {
  return db
    .prepare(
      `
        SELECT * FROM credentials WHERE id = ?
    `
    )
    .get(id) as CredentialRow | undefined;
}

export function getDecryptedCredential(
  id: string,
  userId: string
): Record<string, string> | null {
  const row = db
    .prepare(
      `
        SELECT * FROM credentials WHERE id = ? AND user_id = ?
    `
    )
    .get(id, userId) as CredentialRow | undefined;

  if (!row) return null;

  return JSON.parse(decryptCredential(row.encrypted_data));
}

export function updateCredential(
  id: string,
  userId: string,
  input: Partial<CredentialInput>
): boolean {
  const existing = getCredentialById(id);
  if (!existing || existing.user_id !== userId) return false;

  const now = new Date().toISOString();
  const updates: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  if (input.name) {
    updates.push('name = ?');
    values.push(input.name);
  }

  if (input.type) {
    updates.push('type = ?');
    values.push(input.type);
  }

  if (input.data) {
    updates.push('encrypted_data = ?');
    values.push(encryptCredential(JSON.stringify(input.data)));
  }

  values.push(id);

  const result = db
    .prepare(
      `
        UPDATE credentials SET ${updates.join(', ')} WHERE id = ?
    `
    )
    .run(...values);

  return result.changes > 0;
}

export function deleteCredential(id: string, userId: string): boolean {
  const result = db
    .prepare(
      `
        DELETE FROM credentials WHERE id = ? AND user_id = ?
    `
    )
    .run(id, userId);

  return result.changes > 0;
}

export function getCredentialsByType(
  userId: string,
  type: string
): Omit<CredentialRow, 'encrypted_data'>[] {
  return db
    .prepare(
      `
        SELECT id, user_id, name, type, created_at, updated_at 
        FROM credentials 
        WHERE user_id = ? AND type = ?
        ORDER BY created_at DESC
    `
    )
    .all(userId, type) as Omit<CredentialRow, 'encrypted_data'>[];
}
