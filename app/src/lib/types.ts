/**
 * Type definitions for AlgoKit examples and search results
 */

export interface AlgoKitExample {
  example_id: string;
  repository: string;
  title: string;
  summary: string;
  complexity: string;
  language: string;
  feature_tags: string[];
  features_to_demonstrate: string[];
  target_users: string[];
  folder_name?: string;
  vector?: number[]; // 384-dimensional embedding (not returned from API)
}

export interface SearchResult extends Omit<AlgoKitExample, 'vector'> {
  similarity: number; // Similarity percentage (0-100, higher is better)
  _distance: number; // L2 distance (0-2, lower is better)
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
  processingTimeMs: number;
}