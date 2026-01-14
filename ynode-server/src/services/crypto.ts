import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Auto-generated key file for development
const KEY_FILE = path.join(process.cwd(), 'data', 'encryption.key');

export function getEncryptionSecret(): string {
  // Check environment variable first
  const envSecret =
    process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (envSecret) {
    return envSecret;
  }

  // For development: auto-generate and persist a key
  try {
    if (fs.existsSync(KEY_FILE)) {
      return fs.readFileSync(KEY_FILE, 'utf8').trim();
    }

    // Generate new key
    const newKey = crypto.randomBytes(32).toString('hex');
    const dir = path.dirname(KEY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(KEY_FILE, newKey, 'utf8');
    console.log('Generated new encryption key at', KEY_FILE);
    return newKey;
  } catch {
    throw new Error(
      'CREDENTIAL_ENCRYPTION_KEY must be set, or data directory must be writable'
    );
  }
}

function getKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    getEncryptionSecret(),
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted text format');
  }

  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = Buffer.from(parts[3], 'hex');

  const key = getKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}

export function encryptCredential(value: string): string {
  return encrypt(value);
}

export function decryptCredential(encryptedValue: string): string {
  return decrypt(encryptedValue);
}
