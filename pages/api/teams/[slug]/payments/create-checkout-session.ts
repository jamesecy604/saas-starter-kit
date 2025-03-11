import { NextApiRequest, NextApiResponse } from 'next';

import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import { throwIfNoTeamAccess } from 'models/team';
import { stripe, getStripeCustomerId } from '@/lib/stripe';
import env from '@/lib/env';
import { checkoutSessionSchema, validateWithSchema } from '@/lib/zod';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
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

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { price, quantity } = validateWithSchema(
    checkoutSessionSchema,
    req.body
  );

  const teamMember = await throwIfNoTeamAccess(req, res);
  const session = await getServerSession(req, res, getAuthOptions(req, res));
  const customer = await getStripeCustomerId(teamMember, session);

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer,
      mode: 'subscription',
      line_items: [
        {
          price,
          quantity,
        },
      ],
      success_url: `${env.appUrl}/teams/${teamMember.team.slug}/billing`,
      cancel_url: `${env.appUrl}/teams/${teamMember.team.slug}/billing`,
    });

    return res.status(200).json({ 
      success: true,
      data: checkoutSession 
    });
  } catch (error: any) {
    console.error('Stripe checkout session creation failed:', error);
    return res.status(500).json({ 
      success: false,
      error: {
        message: 'Failed to create checkout session',
        details: error.message
      }
    });
  }
};
