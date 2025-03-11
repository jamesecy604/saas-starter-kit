import { getServerSession } from 'next-auth';
import { getAuthOptions } from './nextAuth';
import type { Session } from 'next-auth';
import type { GetServerSidePropsContext } from 'next';
import type { IncomingMessage, ServerResponse } from 'http';

export async function getSession(
  req: IncomingMessage & { cookies: Partial<{ [key: string]: string }> },
  res: ServerResponse<IncomingMessage>
) {
  return await getServerSession(req, res, getAuthOptions(req, res));
}

export async function getCurrentUser(
  req: IncomingMessage & { cookies: Partial<{ [key: string]: string }> },
  res: ServerResponse<IncomingMessage>
) {
  const session = await getSession(req, res);
  return session?.user;
}

export async function requireSession(
  req: IncomingMessage & { cookies: Partial<{ [key: string]: string }> },
  res: ServerResponse<IncomingMessage>
) {
  const session = await getSession(req, res);
  
  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

export async function requireRole(
  role: string,
  req: IncomingMessage & { cookies: Partial<{ [key: string]: string }> },
  res: ServerResponse<IncomingMessage>
) {
  const session = await requireSession(req, res);
  
  if (!session.user.roles.some(r => r.role === role)) {
    throw new Error('Forbidden');
  }

  return session;
}

export type { Session };
