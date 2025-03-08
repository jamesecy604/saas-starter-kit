import { prisma } from '@/lib/prisma';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('API_KEY_ENCRYPTION_KEY environment variable is required');
}

const encrypt = (text: string): string => {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

interface CreateApiKeyParams {
  name: string;
  teamId: string;
  userId: string;
}

const hashApiKey = (apiKey: string) => {
  return createHash('sha256').update(apiKey).digest('hex');
};

const generateUniqueApiKey = () => {
  const apiKey = randomBytes(16).toString('hex');

  return [hashApiKey(apiKey), apiKey];
};

export const createApiKey = async (params: CreateApiKeyParams) => {
  const { name, teamId , userId} = params;

  const [hashedKey, apiKey] = generateUniqueApiKey();
  const encryptedKey = encrypt(apiKey);

  await prisma.apiKey.create({
    data: {
      name,
      hashedKey: hashedKey,
      encryptedKey: encryptedKey,
      team: { connect: { id: teamId } },
      user: { connect: { id: userId } },
    },
  });

  return apiKey;
};

export const fetchApiKeys = async (teamId: string, userId: string) => {
  return prisma.apiKey.findMany({
    where: {
      teamId,
      userId
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
  });
};

export const deleteApiKey = async (id: string) => {
  return prisma.apiKey.delete({
    where: {
      id,
    },
  });
};

export const getApiKey = async (apiKey: string) => {
  return prisma.apiKey.findUnique({
    where: {
      hashedKey: hashApiKey(apiKey),
    },
    select: {
      id: true,
      teamId: true,
      userId: true
    },
  });
};

export const getApiKeyById = async (id: string) => {
  return prisma.apiKey.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      teamId: true,
      userId: true,
      encryptedKey: true
    },
  });
};

export const getDecryptedApiKey = async (id: string, userId: string) => {
  const apiKey = await prisma.apiKey.findUnique({
    where: {
      id,
      userId
    },
    select: {
      encryptedKey: true
    },
  });

  if (!apiKey?.encryptedKey) {
    throw new Error('API key not found or not accessible');
  }

  return decrypt(apiKey.encryptedKey);
};
