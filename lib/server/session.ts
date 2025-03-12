import type { NextApiRequest, NextApiResponse } from 'next';
import type { Session } from 'next-auth';
import { getSession as nextAuthGetSession } from 'next-auth/react';

export async function getCachedSession(
  req: NextApiRequest | null,
  res: NextApiResponse | null
): Promise<Session | null> {
  if (typeof window !== 'undefined') {
    // Client-side - use client-side getSession
    return await nextAuthGetSession();
  }

  if (!req || !res) {
    return null;
  }

  // Server-side - get fresh session
  return await nextAuthGetSession({ req });
}
