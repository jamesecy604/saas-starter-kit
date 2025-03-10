import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.query.id as string;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { systemRole: true },
    });

    // If user is system admin, return immediately
    if (user?.systemRole === 'SYSADMIN') {
      return res.status(200).json({ role: 'SYSADMIN' });
    }

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      select: { role: true },
    });

    if (!memberships.length) {
      return res.status(200).json({ role: 'OWNER' });
    }

    // Return the highest privileged role from all memberships
    const roles = memberships.map((m) => m.role);
    const role = roles.includes('OWNER')
      ? 'OWNER'
      : roles.includes('ADMIN')
      ? 'ADMIN'
      : 'MEMBER';

    return res.status(200).json({ role });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
