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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current uses count from KV
    const currentUses = await kv.get<number>(GLOBAL_COUNTER_KEY) || 0;
    const remainingUses = Math.max(0, MAX_USES - currentUses);

    return res.status(200).json({
      remainingUses,
      totalUses: currentUses,
      maxUses: MAX_USES
    });
  } catch (error) {
    console.error('Error fetching remaining uses:', error);
    return res.status(500).json({
      error: 'Failed to fetch remaining uses',
      remainingUses: 0
    });
  }
}
