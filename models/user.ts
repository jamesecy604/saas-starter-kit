import { ApiError } from '@/lib/errors';
import { Action, Resource, checkAccess, getCachedSession} from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import type { NextApiRequest, NextApiResponse, NextPageContext } from 'next';
import { getSession } from '@/lib/session';
import { maxLengthPolicies } from '@/lib/common';

export const normalizeUser = (user) => {
  if (user?.name) {
    user.name = user.name.substring(0, maxLengthPolicies.name);
  }

  return user;
};

export const createUser = async (data: {
  name: string;
  email: string;
  password?: string;
  emailVerified?: Date | null;
}) => {
  // Create tenant first
  const tenant = await prisma.tenant.create({
    data: {
      name: `${data.name}'s Tenant`,
    }
  });

  // Create user with tenant association
  return await prisma.user.create({
    data: {
      ...normalizeUser(data),
      tenantId: tenant.id
    },
  });
};

export const updateUser = async ({ where, data }) => {
  data = normalizeUser(data);

  return await prisma.user.update({
    where,
    data,
  });
};

export const upsertUser = async ({ where, update, create }) => {
  update = normalizeUser(update);
  create = normalizeUser(create);

  return await prisma.user.upsert({
    where,
    update,
    create,
  });
};

export const getUser = async (key: { id: string } | { email: string }) => {
  const user = await prisma.user.findUnique({
    where: key,
  });

  return normalizeUser(user);
};

export const getUserBySession = async (session: Session | null) => {
  if (session === null || session.user === null) {
    return null;
  }

  const id = session?.user?.id;

  if (!id) {
    return null;
  }

  return await getUser({ id });
};

export const deleteUser = async (key: { id: string } | { email: string }) => {
  // First get user ID if we only have email
  const user = await prisma.user.findUnique({
    where: key,
    select: { id: true }
  });

  if (!user) {
    return null;
  }

  // Delete all sessions for this user
  await prisma.session.deleteMany({
    where: { userId: user.id }
  });

  // Now delete the user
  return await prisma.user.delete({
    where: { id: user.id },
  });
};

export const findFirstUserOrThrow = async ({ where }) => {
  const user = await prisma.user.findFirstOrThrow({
    where,
  });

  return normalizeUser(user);
};


export const throwIfNotAllowed = async (
  req: NextApiRequest,
  res: NextApiResponse,
  resource: Resource,
  action: Action
) => {
  const session = await getCachedSession(req, res);
  const result = await checkAccess(session, resource, action);
  if (!result.allowed) {
    throw new ApiError(result.status, result.message);
  }
  return true;
};


// Get current user from session
export const getCurrentUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session.user;
};
