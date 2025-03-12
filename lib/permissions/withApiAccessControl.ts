import { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import { ApiError } from '@/lib/errors';

type AccessControlOptions = {
  roles?: string[];
};

export function withApiAccessControl(
  roles: string[],
  handler: NextApiHandler
): NextApiHandler {
  return async (req, res) => {
    const session = await getServerSession(
      req,
      res,
      getAuthOptions(req, res)
    );

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if user has required role
    if (roles.length > 0 && (!session.user.systemRole || !roles.includes(session.user.systemRole))) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    return handler(req, res);
  };
}
