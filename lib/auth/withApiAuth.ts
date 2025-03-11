import type { NextApiHandler } from 'next';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import { Role } from '@/lib/permissions';

type ApiAuthOptions = {
  roles?: Role[];
};

export function withApiAuth(
  handler: NextApiHandler,
  options: ApiAuthOptions = {}
): NextApiHandler {
  return async (req, res) => {
    const session = await getServerSession(req, res, getAuthOptions(req, res));

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (options.roles) {
      const userRoles = session.user.roles || [];
      if (!userRoles.some(role => options.roles?.includes(role.role))) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    return handler(req, res);
  };
}
