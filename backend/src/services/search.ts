/**
 * Vector search orchestration for backend
 *
 * Combines the embedding service and database to perform semantic search
 * over AlgoKit examples.
 */

import { getTable } from './database.js'
import { embedQuery } from './embedder.js'

interface AlgoKitExample {
  example_id: string
  repository: string
  title: string
  summary: string
  complexity: string
  language: string
  feature_tags: string[]
  features_to_demonstrate: string[]
  target_users: string[]
  folder_name?: string
  vector: number[]
}

interface SearchResult extends AlgoKitExample {
  _distance: number // L2 distance from LanceDB (0-2, lower is better)
  similarity: number // Similarity percentage (0-100, higher is better)
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  count: number
  processingTimeMs: number
}

/**
 * Search for AlgoKit examples using semantic similarity
 *
 * @param query - The search query text
 * @param limit - Maximum number of results to return (default: 10, max: 50)
 * @returns Search response with results and metadata
 */
export async function searchExamples(
  query: string,
  limit: number = 10
): Promise<SearchResponse> {
  const startTime = Date.now()

  // Validate query
  if (!query || !query.trim()) {
    throw new Error('Search query cannot be empty')
  }

  if (query.length > 500) {
    throw new Error('Search query too long (max 500 characters)')
  }

  // Clamp limit to valid range
  const clampedLimit = Math.max(1, Math.min(50, limit))

  try {
    console.log(`Searching for: "${query}" (limit: ${clampedLimit})`)

    // Step 1: Convert query to vector embedding
    const queryVector = await embedQuery(query)
    console.log('✓ Query embedded')

    // Step 2: Get the database table
    const table = getTable()

    // Step 3: Perform vector similarity search
    console.log('Searching database...')
    const results = await table
      .search(queryVector)
      .limit(clampedLimit)
      .toArray()

    console.log(`✓ Found ${results.length} results`)

    // Step 4: Format results with similarity scores
    const formattedResults: SearchResult[] = results.map((result: any) => ({
      ...result,
      similarity: distanceToSimilarity(result._distance)
    }))

    const processingTimeMs = Date.now() - startTime

    return {
      results: formattedResults,
      query: query.trim(),
      count: formattedResults.length,
      processingTimeMs
    }
  } catch (error) {
    console.error('Search failed:', error)
    throw new Error(
      `Search query failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Get example by ID
 *
 * @param exampleId - The example_id to look up
 * @returns The matching example or null if not found
 */
export async function getExampleById(exampleId: string): Promise<AlgoKitExample | null> {
  if (!exampleId || !exampleId.trim()) {
    throw new Error('Example ID cannot be empty')
  }

  try {
    const table = getTable()

    // Filter for exact match on example_id
    const results = await table
      .filter(`example_id = '${exampleId}'`)
      .limit(1)
      .toArray()

    if (results.length === 0) {
      console.log(`Example not found: ${exampleId}`)
      return null
    }

    return results[0] as AlgoKitExample
  } catch (error) {
    console.error(`Failed to get example ${exampleId}:`, error)
    throw new Error(
      `Failed to retrieve example: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Calculate similarity percentage from L2 distance
 *
 * LanceDB returns L2 distance for normalized vectors (0-2, lower is better)
 * Convert to similarity percentage (0-100%, higher is better)
 *
 * For normalized vectors:
 * - Distance 0.0 = identical vectors → 100% similarity
 * - Distance 1.0 = moderate difference → 50% similarity
 * - Distance 2.0 = opposite vectors → 0% similarity
 *
 * @param distance - L2 distance from LanceDB
 * @returns Similarity as percentage (0-100)
 */
export function distanceToSimilarity(distance: number): number {
  // Convert L2 distance to similarity percentage
  // Formula: similarity = max(0, 100 - (distance * 50))
  const similarity = 100 - (distance * 50)
  return Math.max(0, Math.min(100, Math.round(similarity * 10) / 10))
}