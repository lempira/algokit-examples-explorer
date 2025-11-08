/**
 * JSON Schema definitions using TypeBox
 *
 * Provides type-safe validation and TypeScript types for API requests/responses.
 */

import { Type } from "@sinclair/typebox";

/**
 * Schema for POST /api/search request body
 */
export const SearchRequestSchema = Type.Object({
  query: Type.String({
    minLength: 1,
    maxLength: 500,
    description: "Search query text for semantic similarity search",
  }),
  limit: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 50,
      default: 10,
      description: "Maximum number of results to return",
    })
  ),
});

/**
 * Schema for search result item (AlgoKit example with similarity score)
 */
export const SearchResultSchema = Type.Object({
  example_id: Type.String({ description: "Unique example identifier" }),
  repository: Type.String({ description: "Source repository name" }),
  title: Type.String({ description: "Example title" }),
  summary: Type.String({ description: "Example description" }),
  complexity: Type.String({
    description: "Complexity level: simple, intermediate, complex",
  }),
  language: Type.String({
    description: "Programming language: typescript, python",
  }),
  feature_tags: Type.Array(Type.String(), {
    description: "Feature tags for categorization",
  }),
  features_to_demonstrate: Type.Array(Type.String(), {
    description: "Features demonstrated",
  }),
  target_users: Type.Array(Type.String(), { description: "Target user types" }),
  folder_name: Type.Optional(
    Type.String({ description: "Folder name in repository" })
  ),
  source_code: Type.Optional(
    Type.String({ description: "Example source code" })
  ),
  similarity: Type.Number({
    minimum: 0,
    maximum: 100,
    description: "Similarity score as percentage (0-100)",
  }),
  _distance: Type.Number({
    minimum: 0,
    description: "L2 distance from query vector (lower is better)",
  }),
});

/**
 * Schema for POST /api/search response
 */
export const SearchResponseSchema = Type.Object({
  results: Type.Array(SearchResultSchema, {
    description: "Array of matching examples",
  }),
  query: Type.String({ description: "The search query that was executed" }),
  count: Type.Integer({
    minimum: 0,
    description: "Number of results returned",
  }),
  processingTimeMs: Type.Number({
    minimum: 0,
    description: "Processing time in milliseconds",
  }),
});

/**
 * Schema for AlgoKit example (without search metadata)
 */
export const AlgoKitExampleSchema = Type.Object({
  example_id: Type.String(),
  repository: Type.String(),
  title: Type.String(),
  summary: Type.String(),
  complexity: Type.String(),
  language: Type.String(),
  feature_tags: Type.Array(Type.String()),
  features_to_demonstrate: Type.Array(Type.String()),
  target_users: Type.Array(Type.String()),
  folder_name: Type.Optional(Type.String()),
  source_code: Type.Optional(Type.String()),
  vector: Type.Array(Type.Number(), {
    description: "384-dimensional embedding vector",
  }),
});

/**
 * Schema for GET /api/examples/:id params
 */
export const ExampleIdParamsSchema = Type.Object({
  id: Type.String({
    minLength: 1,
    description: "Example ID to retrieve",
  }),
});

/**
 * Schema for GET /api/health response
 */
export const HealthResponseSchema = Type.Object({
  status: Type.String({ description: "Service status: ok or error" }),
  timestamp: Type.String({ description: "ISO timestamp" }),
  services: Type.Object({
    database: Type.Boolean({ description: "Database service initialized" }),
    embedder: Type.Boolean({ description: "Embedder service initialized" }),
  }),
  examplesCount: Type.Integer({
    minimum: 0,
    description: "Number of examples in database",
  }),
});

/**
 * Schema for error responses
 */
export const ErrorResponseSchema = Type.Object({
  statusCode: Type.Integer(),
  error: Type.String(),
  message: Type.String(),
});
