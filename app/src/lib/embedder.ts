/**
 * Browser-based embedding service using Transformers.js
 *
 * Uses the same model as the Python pipeline (all-MiniLM-L6-v2)
 * to ensure vector compatibility for semantic search.
 */

import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js environment
// Models will be downloaded from Hugging Face CDN
env.allowLocalModels = false;

let embedder: any = null;
let isLoading = false;

/**
 * Initialize the embedding model (lazy-loaded on first use)
 */
async function initializeEmbedder() {
  if (embedder) {
    return embedder;
  }

  if (isLoading) {
    // Wait for existing initialization to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return embedder;
  }

  isLoading = true;
  console.log('Loading all-MiniLM-L6-v2 embedding model...');
  console.log('This may take a moment on first load (~25MB download)');

  try {
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        progress_callback: (progress: any) => {
          if (progress.status === 'downloading') {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
            console.log(`Downloading model: ${percent}%`);
          } else if (progress.status === 'done') {
            console.log('✓ Model downloaded');
          }
        }
      }
    );

    console.log('✓ Embedding model ready');
  } catch (error) {
    console.error('Failed to load embedding model:', error);
    throw error;
  } finally {
    isLoading = false;
  }

  return embedder;
}

/**
 * Generate embedding vector for a query string
 *
 * Returns a 384-dimensional normalized vector for semantic search.
 * Uses mean pooling and L2 normalization to match Python pipeline.
 *
 * @param query - The search query text
 * @returns 384-dimensional embedding vector
 */
export async function embedQuery(query: string): Promise<number[]> {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  const model = await initializeEmbedder();

  console.log(`Generating embedding for query: "${query}"`);

  // Generate embedding with same settings as Python
  const output = await model(query, {
    pooling: 'mean',      // Mean pooling (same as Python)
    normalize: true        // L2 normalization (same as Python)
  });

  // Convert tensor to array
  const embedding = Array.from(output.data);

  console.log(`✓ Generated ${embedding.length}-dimensional embedding`);

  return embedding;
}

/**
 * Check if the embedding model is initialized
 */
export function isEmbedderReady(): boolean {
  return embedder !== null;
}

/**
 * Pre-load the embedding model (optional, for better UX)
 * Call this during app initialization to avoid delay on first search
 */
export async function preloadEmbedder(): Promise<void> {
  await initializeEmbedder();
}