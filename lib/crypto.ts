import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = process.env.API_KEY_ENCRYPTION_KEY;

if (!key) {
  throw new Error('API_KEY_ENCRYPTION_KEY environment variable is required');
}

const iv = crypto.randomBytes(16);

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key as string, 'base64'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key as string, 'base64'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
