import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { withApiAccessControl } from '@/lib/permissions/withApiAccessControl';
import { prisma } from '@/lib/prisma';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'DELETE':
      return handleDeleteModel(req, res);
    case 'PUT':
      return handleUpdateModel(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
};

async function handleDeleteModel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Model ID is required' });
    }

    const modelId = Number(id);
    
    if (isNaN(modelId)) {
      return res.status(400).json({ message: 'Invalid model ID format' });
    }

    // Check if model exists first
    const existingModel = await prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!existingModel) {
      return res.status(404).json({ message: 'Model not found' });
    }

    await prisma.model.delete({
      where: { id: modelId }
    });
    
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      message: 'Failed to delete model',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

async function handleUpdateModel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const modelId = Number(id);
    
    if (isNaN(modelId)) {
      return res.status(400).json({ message: 'Invalid model ID format' });
    }

    const existingModel = await prisma.model.findUnique({
      where: { id: modelId }
    });

    if (!existingModel) {
      return res.status(404).json({ message: 'Model not found' });
    }

    const updatedModel = await prisma.model.update({
      where: { id: modelId },
      data: req.body
    });
    return res.status(200).json(updatedModel);
  } catch (error) {
    console.error('Error updating model:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      message: 'Failed to update model',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

export default withApiAuth(
  withApiAccessControl(
    ['SYSADMIN'],
    handler
  )
);
