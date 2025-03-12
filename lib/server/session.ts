import type { NextApiRequest, NextApiResponse } from 'next';
import type { Session } from 'next-auth';
import { getSession as nextAuthGetSession } from 'next-auth/react';

// Cache session for 5 minutes
const sessionCache = new Map<string, { session: any, timestamp: number }>();

export async function getCachedSession(
  req: NextApiRequest | null,
  res: NextApiResponse | null
): Promise<Session | null> {
  if (typeof window !== 'undefined') {
    // Client-side - return null session
    return null;
  }

  if (!req || !res) {
    return null;
  }

  const cacheKey = req.headers.authorization || req.cookies['next-auth.session-token'];
  let session;
  
  // Check cache first
  if (cacheKey && sessionCache.has(cacheKey)) {
    const cached = sessionCache.get(cacheKey)!;
    // If cache is fresh (less than 5 minutes old)
    if (Date.now() - cached.timestamp < 300000) {
      session = cached.session;
    }
  }
  
  // If no valid cache, fetch fresh session
  if (!session) {
    session = await nextAuthGetSession({ req });
    if (cacheKey) {
      sessionCache.set(cacheKey, {
        session,
        timestamp: Date.now()
      });
    }
  }
  
  return session;
}
