import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

const MAX_USES = 100;
const GLOBAL_COUNTER_KEY = 'photo-restoration-global-uses';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Increment the counter atomically
    const currentUses = await kv.incr(GLOBAL_COUNTER_KEY);
    const remainingUses = Math.max(0, MAX_USES - currentUses);

    // Check if limit exceeded
    if (currentUses > MAX_USES) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        remainingUses: 0,
        totalUses: currentUses,
        maxUses: MAX_USES
      });
    }

    return res.status(200).json({
      success: true,
      remainingUses,
      totalUses: currentUses,
      maxUses: MAX_USES
    });
  } catch (error) {
    console.error('Error incrementing uses:', error);
    return res.status(500).json({
      error: 'Failed to record usage',
      success: false
    });
  }
}
