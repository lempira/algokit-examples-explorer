/**
 * Query embedding service for backend
 *
 * Uses Transformers.js to convert search queries into 384-dimensional vectors.
 * Uses the same model as the Python pipeline (all-MiniLM-L6-v2) to ensure
 * vector compatibility for semantic search.
 */

import { pipeline, env } from '@xenova/transformers'

// Configure cache directory for model files
env.cacheDir = './.cache'

let embedder: any = null
let isLoading = false

/**
 * Initialize the embedding model
 *
 * Downloads and loads the all-MiniLM-L6-v2 model (~25MB).
 * Should be called once on server startup for best performance.
 *
 * @throws Error if model fails to load
 */
export async function initializeEmbedder(): Promise<void> {
  if (embedder) {
    console.log('Embedder already initialized')
    return
  }

  if (isLoading) {
    // Wait for existing initialization to complete
    console.log('Waiting for embedder initialization...')
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return
  }

  isLoading = true

  try {
    console.log('Loading all-MiniLM-L6-v2 embedding model...')
    console.log('This may take 10-20s on first run (~25MB download)')

    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        progress_callback: (progress: any) => {
          if (progress.status === 'downloading') {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(1)
            console.log(`  Downloading model: ${percent}%`)
          } else if (progress.status === 'done') {
            console.log('  ✓ Model downloaded')
          }
        }
      }
    )

    console.log('✓ Embedding model loaded and ready')
  } catch (error) {
    console.error('Failed to load embedding model:', error)
    throw new Error(
      `Embedding model initialization failed: ${error instanceof Error ? error.message : String(error)}`
    )
  } finally {
    isLoading = false
  }
}

/**
 * Generate embedding vector for a query string
 *
 * Returns a 384-dimensional normalized vector for semantic search.
 * Uses mean pooling and L2 normalization to match Python pipeline.
 *
 * @param query - The search query text
 * @returns 384-dimensional embedding vector
 * @throws Error if embedder is not initialized or query is invalid
 */
export async function embedQuery(query: string): Promise<number[]> {
  if (!embedder) {
    throw new Error('Embedder not initialized. Call initializeEmbedder() first.')
  }

  if (!query.trim()) {
    throw new Error('Query cannot be empty')
  }

  try {
    // Generate embedding with same settings as Python pipeline
    const output = await embedder(query, {
      pooling: 'mean',    // Mean pooling (same as Python)
      normalize: true     // L2 normalization (same as Python)
    })

    // Convert tensor to array
    const embedding: number[] = Array.from(output.data)

    if (embedding.length !== 384) {
      throw new Error(`Expected 384-dimensional vector, got ${embedding.length}`)
    }

    return embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    throw new Error(
      `Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Check if the embedding model is initialized and ready
 */
export function isInitialized(): boolean {
  return embedder !== null
}