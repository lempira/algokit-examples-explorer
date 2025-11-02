/**
 * Vector search orchestration
 *
 * Combines the embedding service and database to perform semantic search
 * over AlgoKit examples.
 */

import { embedQuery } from './embedder';
import { getTable } from './db';
import type { SearchResult } from './types';

/**
 * Search for AlgoKit examples using semantic similarity
 *
 * @param query - The search query text
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of matching examples with similarity scores
 */
export async function searchExamples(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  console.log(`Searching for: "${query}"`);

  try {
    // Step 1: Convert query to vector embedding
    const queryVector = await embedQuery(query);
    console.log('✓ Query embedded');

    // Step 2: Get the database table
    const table = getTable();

    // Step 3: Perform vector similarity search
    console.log('Searching database...');
    const results = await table
      .search(queryVector)
      .limit(limit)
      .execute();

    console.log(`✓ Found ${results.length} results`);

    // Return typed results
    return results as SearchResult[];
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

/**
 * Get example by ID
 *
 * @param exampleId - The example_id to look up
 * @returns The matching example or null if not found
 */
export async function getExampleById(exampleId: string): Promise<SearchResult | null> {
  try {
    const table = getTable();

    // Query for exact match on example_id
    const results = await table
      .query()
      .where(`example_id = '${exampleId}'`)
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0] as SearchResult;
  } catch (error) {
    console.error(`Failed to get example ${exampleId}:`, error);
    return null;
  }
}

/**
 * Calculate similarity percentage from distance
 *
 * LanceDB returns cosine distance (0-2, lower is better)
 * Convert to similarity percentage (0-100%, higher is better)
 *
 * @param distance - Cosine distance from LanceDB
 * @returns Similarity as percentage (0-100)
 */
export function distanceToSimilarity(distance: number): number {
  // Cosine distance: 0 = identical, 2 = opposite
  // Convert to similarity: (2 - distance) / 2 * 100
  const similarity = ((2 - distance) / 2) * 100;
  return Math.max(0, Math.min(100, similarity));
}

/**
 * Format search results with human-readable similarity scores
 *
 * @param results - Raw search results from LanceDB
 * @returns Results with added similarity percentage
 */
export function formatResults(results: SearchResult[]): Array<SearchResult & { similarity: number }> {
  return results.map(result => ({
    ...result,
    similarity: distanceToSimilarity(result._distance)
  }));
}