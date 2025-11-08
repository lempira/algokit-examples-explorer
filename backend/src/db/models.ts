/**
 * Database schema definitions and types
 *
 * Defines Apache Arrow schemas for LanceDB tables to handle
 * empty arrays and ensure proper type inference.
 */

import {
  Schema,
  Field,
  Float32,
  Utf8,
  List,
  FixedSizeList,
} from "apache-arrow";

/**
 * TypeScript interface for AlgoKit examples
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
  source_code?: string;
  vector: number[]; // 384-dimensional embedding
}

/**
 * Apache Arrow schema for AlgoKit examples table
 *
 * Explicit schema required to handle empty arrays properly.
 * LanceDB cannot infer types from empty arrays.
 */
export const examplesSchema = new Schema([
  new Field("example_id", new Utf8()),
  new Field("repository", new Utf8()),
  new Field("title", new Utf8()),
  new Field("summary", new Utf8()),
  new Field("complexity", new Utf8()),
  new Field("language", new Utf8()),
  new Field("feature_tags", new List(new Field("item", new Utf8()))),
  new Field("features_to_demonstrate", new List(new Field("item", new Utf8()))),
  new Field("target_users", new List(new Field("item", new Utf8()))),
  new Field("folder_name", new Utf8(), true), // nullable
  new Field("source_code", new Utf8(), true), // nullable
  new Field("vector", new FixedSizeList(384, new Field("item", new Float32()))),
]);
