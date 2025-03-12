import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { checkAccess } from '@/lib/permissions';
import { getCachedSession } from '@/lib/server/session';

import { NextApiHandler } from 'next';

const handler: NextApiHandler = async (req, res) => {
    
  // Check access for model_management resource
  const session = await getCachedSession(req, res);
  const accessResult = await checkAccess(session, 'model_management', 'read');
  if (!accessResult.allowed) {
    return res.status(accessResult.status).json({ message: accessResult.message });
  }

  switch (req.method) {
    case 'GET':
      return handleGetModels(req, res);
    case 'POST':
      return handleCreateModel(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

export default handler;

async function handleGetModels(req: NextApiRequest, res: NextApiResponse) {
  try {
    const models = await prisma.model.findMany();
    return res.status(200).json(models);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch models', error });
  }
}

async function handleCreateModel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const modelData = req.body;
    const newModel = await prisma.model.create({
      data: modelData
    });
    return res.status(201).json(newModel);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create model', error });
  }
}
