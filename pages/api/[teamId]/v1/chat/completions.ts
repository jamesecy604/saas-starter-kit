import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

const hashApiKey = (apiKey: string) => {
  return createHash('sha256').update(apiKey).digest('hex');
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No bearer in header' });
    }

    const apiKeyValue = authHeader.substring(7);
    const hashedApiKey = hashApiKey(apiKeyValue);
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { hashedKey: hashedApiKey }
    });

    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const user = await prisma.user.findFirst({
      where: { id: apiKeyRecord.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { teamId: true }
    });

    if (!teamMember) {
      return res.status(403).json({ error: 'User is not a member of any team' });
    }

    const teamId = teamMember.teamId;

    const body = req.body;
    if (!body || !body.model || !body.messages) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    const { model, messages, temperature, stream } = body;

    const modelConfig = await prisma.model.findUnique({
      where: { name: model },
      select: {
        name: true,
        provider: true,
        providerUrl: true,
      },
    });

    if (!modelConfig) {
      return res.status(400).json({ error: 'Model not supported' });
    }

    const api = new OpenAI({
      apiKey: process.env[`${modelConfig.provider.toUpperCase()}_API_KEY`],
      baseURL: modelConfig.providerUrl,
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await api.chat.completions.create({
        model: modelConfig.name,
        messages,
        temperature: temperature ?? 0.7,
        stream: true
      });

      for await (const chunk of responseStream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.end();

      const usage = { promptTokens: messages.length, completionTokens: 0 };
      await trackUsage(user.id, teamId, usage, apiKeyValue);
    } else {
      const response = await api.chat.completions.create({
        model: modelConfig.name,
        messages,
        temperature: temperature ?? 0.7,
        stream: false
      });

      if (!response?.choices?.length || !response.choices[0]?.message?.content) {
        console.error('Invalid API response:', response);
        return res.status(500).json({
          error: 'Invalid response from AI provider',
          details: 'No assistant message content received'
        });
      }

      const usage = response.usage
        ? { promptTokens: response.usage.prompt_tokens, completionTokens: response.usage.completion_tokens }
        : { promptTokens: 0, completionTokens: 0 };

      await trackUsage(user.id, teamId, usage, apiKeyValue);

      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function trackUsage(userId: string, teamId: string, usage: { promptTokens: number; completionTokens: number; cost?: number }, apiKey: string) {
  console.log('Tracking usage:', { userId, teamId, usage, apiKey });

  if (!userId || !teamId || !apiKey) {
    console.error('Invalid arguments for tracking usage:', { userId, teamId, apiKey });
    return;
  }

  const payload = {
    apiKey,
    teamId,
    userId,
    inputTokens: usage.promptTokens || 0,
    outputTokens: usage.completionTokens || 0,
    cost: 0,
    createdAt: new Date(),
  };

  await prisma.usage.create({
    data: payload
  });
}
