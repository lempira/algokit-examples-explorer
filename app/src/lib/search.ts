/**
 * Backend API client for search functionality
 *
 * Simple fetch-based client that communicates with the backend API
 * for semantic search over AlgoKit examples.
 */

import type { SearchResponse, SearchResult, AlgoKitExample, HealthResponse } from './types';

// Backend API URL - use environment variable for Cloud Run, fallback to localhost for dev
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3001/api';

/**
 * Search for AlgoKit examples using semantic similarity
 *
 * Calls the backend API to perform vector search.
 *
 * @param query - The search query text
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Search response with results and metadata
 */
export async function searchExamples(
  query: string,
  limit: number = 10
): Promise<SearchResponse> {
  // Validate input
  if (!query || !query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  console.log(`Searching for: "${query}"`);

  try {
    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, limit })
    });

    if (!response.ok) {
      // Try to get error message from response
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data: SearchResponse = await response.json();
    console.log(`✓ Found ${data.count} results in ${data.processingTimeMs}ms`);

    return data;
  } catch (error) {
    console.error('Search request failed:', error);

    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to backend. Is it running on http://localhost:3001?');
    }

    throw error;
  }
}

/**
 * Get a specific AlgoKit example by ID
 *
 * @param exampleId - The example_id to look up
 * @returns The matching example or null if not found
 */
export async function getExampleById(exampleId: string): Promise<AlgoKitExample | null> {
  if (!exampleId || !exampleId.trim()) {
    throw new Error('Example ID cannot be empty');
  }

  try {
    const response = await fetch(`${API_URL}/examples/${encodeURIComponent(exampleId)}`);

    // 404 is expected for not found
    if (response.status === 404) {
      console.log(`Example not found: ${exampleId}`);
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to get example ${exampleId}:`, error);
    throw error;
  }
}

/**
 * Get backend health status and database stats
 *
 * @returns Health response with service status and example count
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`);
  return await response.json();
}

/**
 * Calculate similarity percentage from L2 distance
 *
 * Utility function for any client-side display needs.
 * Note: Backend already includes similarity in search results.
 *
 * @param distance - L2 distance (0-2, lower is better)
 * @returns Similarity as percentage (0-100)
 */
export function distanceToSimilarity(distance: number): number {
  // Convert L2 distance to similarity percentage
  const similarity = 100 - (distance * 50);
  return Math.max(0, Math.min(100, Math.round(similarity * 10) / 10));
}