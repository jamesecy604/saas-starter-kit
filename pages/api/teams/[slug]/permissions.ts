import { checkAccess } from '@/lib/server/permissions';
import { throwIfNoTeamAccess } from 'models/team';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res, session);
        break;
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get permissions for a team for the current user
const handleGET = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) => {
  // Check if user has permission to view team permissions
  const access = await checkAccess(session, 'team', 'read', req.query.slug as string);
  if (!access.allowed) {
    return res.status(access.status).json({ error: { message: access.message } });
  }

  const teamRole = await throwIfNoTeamAccess(req, res);
  res.json({ data: teamRole.permissions });
};
