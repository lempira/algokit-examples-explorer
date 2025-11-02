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
  vector: number[]; // 384-dimensional embedding
}

export interface SearchResult extends AlgoKitExample {
  _distance: number; // Cosine distance (0-2, lower is better)
}