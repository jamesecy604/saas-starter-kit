import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import {prisma} from '@/lib/prisma';
import { createHash } from 'crypto';

const hashApiKey = (apiKey: string) => {
  return createHash('sha256').update(apiKey).digest('hex');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { teamId } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No bearer in header' });
    }

    const apiKeyValue = authHeader.substring(7);
    const hashedApiKey = hashApiKey(apiKeyValue);

    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { hashedKey: hashedApiKey, teamId: teamId as string }
    });

    if (!apiKeyRecord) {
      return res.status(401).json({ error: 'Invalid API key or team ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: apiKeyRecord.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = await req.body;

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
      const responseStream = await api.chat.completions.create({
        model: modelConfig.name,
        messages,
        temperature: temperature ?? 0.7,
        stream: true
      });

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of responseStream) {
              controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            controller.close();
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          }
        }
      });

      const usage = { promptTokens: messages.length, completionTokens: 0 };
      await trackUsage(user.id, teamId as string, usage, apiKeyRecord.id);

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      });
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

      await trackUsage(user.id, teamId as string, usage, apiKeyRecord.id);

      return res.status(200).json({
        ...response,
        choices: response.choices.map(choice => ({
          ...choice,
          message: {
            ...choice.message,
            content: choice.message.content || ''
          }
        }))
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function trackUsage(userId: string, teamId: string, usage: { promptTokens: number; completionTokens: number; cost?: number }, apiKeyId: string) {
  console.log('Tracking usage:', { userId, teamId, usage, apiKeyId });

  if (!userId || !teamId || !apiKeyId) {
    console.error('Invalid arguments for tracking usage:', { userId, teamId, apiKeyId });
    return;
  }

  const payload = {
    apiKeyId,
    teamId,
    userId,
    inputTokens: usage.promptTokens || 0,
    outputTokens: usage.completionTokens || 0,
    cost: 0,
    createdAt: new Date(),
  };
  console.log('Payload for prisma.usage.create:', payload);

  await prisma.usage.create({
    data: payload
  });
}