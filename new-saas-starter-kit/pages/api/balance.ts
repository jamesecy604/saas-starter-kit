import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user's team memberships
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        select: {
          id: true,
          tenantId: true,
          members: {
            select: {
              userId: true,
              role: true
            }
          }
        }
      }
    }
  });

  // Check if user is Owner of any team
  const isOwner = teamMembers.some(member => 
    member.role === 'OWNER'
  );
  if (!isOwner) {
    return res.status(403).json({ error: 'Only team owners can view balance' });
  }

  if (teamMembers.length === 0) {
    return res.status(404).json({ error: 'No team memberships found' });
  }

  // Get all user IDs from teams
  const teamUserIds = teamMembers.flatMap(member => 
    member.team.members.map(m => m.userId)
  );
  const allUserIds = Array.from(new Set([session.user.id, ...teamUserIds]));

  // Check if checkpoint exists
  const existingCheckpoint = await prisma.checkpoint.findUnique({
    where: {
      id: teamMembers[0].team.tenantId
    }
  });

  const calculationTimestamp = new Date();
  const startDate = existingCheckpoint?.calculatedAt || new Date(0);

  // Get total purchased tokens since start date
  const purchases = await prisma.tokenPurchase.aggregate({
    where: { 
      tenantId: teamMembers[0].team.tenantId,
      createdAt: { gte: startDate }
    },
    _sum: {
      inputTokens: true,
      outputTokens: true
    }
  });

  // Get total used tokens since start date
  const usage = await prisma.usage.aggregate({
    where: { 
      userId: { in: allUserIds },
      createdAt: { gte: startDate }
    },
    _sum: {
      inputTokens: true,
      outputTokens: true
    }
  });

  // Calculate available balances
  const balanceOfInput = (purchases._sum.inputTokens || 0) - (usage._sum.inputTokens || 0);
  const balanceOfOutput = (purchases._sum.outputTokens || 0) - (usage._sum.outputTokens || 0);

  // Create checkpoint if it doesn't exist
  if (!existingCheckpoint) {
    await prisma.checkpoint.create({
      data: {
        id: teamMembers[0].team.tenantId,
        tenantId: teamMembers[0].team.tenantId,
        calculatedAt: calculationTimestamp,
        createdAt: calculationTimestamp,
        usageOfInput: usage._sum.inputTokens || 0,
        usageOfOutput: usage._sum.outputTokens || 0,
        balanceOfInput: balanceOfInput,
        balanceOfOutput: balanceOfOutput
      }
    });
  }

  return res.status(200).json({ 
    balanceOfInput,
    balanceOfOutput
  });
}
