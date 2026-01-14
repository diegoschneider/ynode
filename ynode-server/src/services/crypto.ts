import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export function getEncryptionSecret(): string {
  const secret =
    process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY or ENCRYPTION_KEY must be set');
  }
  return secret;
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
  // If text is not in our format, return it as is or throw?
  // Credentials might be plain text if we just started using encryption?
  // No, we require encryption.
  const parts = text.split(':');
  if (parts.length !== 4) {
    // Fallback for legacy plain text if needed, or throw
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
