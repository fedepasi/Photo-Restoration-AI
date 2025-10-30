import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

interface LogExecutionPayload {
  originalImage: string; // base64 data URL
  finalImage: string; // base64 data URL
  userPrompt?: string;
  steps: Array<{
    objective: string;
    prompt: string;
  }>;
}

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
    const payload: LogExecutionPayload = req.body;

    if (!payload.originalImage || !payload.finalImage) {
      return res.status(400).json({
        error: 'Missing required fields: originalImage and finalImage'
      });
    }

    const timestamp = new Date().toISOString();
    const executionId = `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Convert base64 data URLs to Buffers
    const originalImageBuffer = Buffer.from(
      payload.originalImage.split(',')[1] || payload.originalImage,
      'base64'
    );
    const finalImageBuffer = Buffer.from(
      payload.finalImage.split(',')[1] || payload.finalImage,
      'base64'
    );

    // Upload original image to Vercel Blob
    const originalBlob = await put(
      `executions/${executionId}/original.jpg`,
      originalImageBuffer,
      {
        access: 'public',
        addRandomSuffix: false
      }
    );

    // Upload final image to Vercel Blob
    const finalBlob = await put(
      `executions/${executionId}/final.jpg`,
      finalImageBuffer,
      {
        access: 'public',
        addRandomSuffix: false
      }
    );

    // Create metadata JSON
    const metadata = {
      executionId,
      timestamp,
      userPrompt: payload.userPrompt || '',
      steps: payload.steps,
      originalImageUrl: originalBlob.url,
      finalImageUrl: finalBlob.url
    };

    // Upload metadata
    const metadataBlob = await put(
      `executions/${executionId}/metadata.json`,
      JSON.stringify(metadata, null, 2),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json'
      }
    );

    console.log('✅ Execution logged:', {
      id: executionId,
      timestamp,
      originalUrl: originalBlob.url,
      finalUrl: finalBlob.url,
      metadataUrl: metadataBlob.url
    });

    return res.status(200).json({
      success: true,
      executionId,
      timestamp,
      urls: {
        original: originalBlob.url,
        final: finalBlob.url,
        metadata: metadataBlob.url
      }
    });
  } catch (error) {
    console.error('Error logging execution:', error);
    return res.status(500).json({
      error: 'Failed to log execution',
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
