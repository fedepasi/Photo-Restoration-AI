import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

const MAX_USES = 100;
const GLOBAL_COUNTER_KEY = 'photo-restoration-global-uses';

// Create Redis client
const getRedisClient = () => {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set');
  }
  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
  });
};

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

  const redis = getRedisClient();

  try {
    // Get current uses count from Redis
    const currentUsesStr = await redis.get(GLOBAL_COUNTER_KEY);
    const currentUses = currentUsesStr ? parseInt(currentUsesStr, 10) : 0;
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
  } finally {
    await redis.quit();
  }
}
