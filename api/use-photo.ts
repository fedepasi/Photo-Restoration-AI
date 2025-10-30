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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redis = getRedisClient();

  try {
    // Increment the counter atomically
    const currentUses = await redis.incr(GLOBAL_COUNTER_KEY);
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
  } finally {
    await redis.quit();
  }
}
