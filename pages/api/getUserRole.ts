import { NextApiRequest, NextApiResponse } from 'next';
import {prisma} from '@/lib/prisma'; // Adjust the import based on your setup

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: id },
      select: { role: true },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Role not found' });
    }

    return res.status(200).json({ role: teamMember.role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}