/**
 * LanceDB database initialization and management
 *
 * Handles loading embeddings from JSON and creating the vector search table.
 */

import * as lancedb from '@lancedb/lancedb';
import type { Table } from '@lancedb/lancedb';
import type { AlgoKitExample } from './types';

let db: lancedb.Connection | null = null;
let examplesTable: Table | null = null;

/**
 * Initialize LanceDB connection and load embeddings
 */
export async function initializeDatabase(): Promise<Table> {
  if (examplesTable) {
    return examplesTable;
  }

  console.log('Initializing LanceDB...');

  // Connect to LanceDB (stored in IndexedDB)
  db = await lancedb.connect('algokit-examples-db');
  console.log('✓ Connected to LanceDB');

  // Fetch embeddings from public folder
  console.log('Loading embeddings...');
  const response = await fetch('/embeddings.json');

  if (!response.ok) {
    throw new Error(`Failed to load embeddings: ${response.statusText}`);
  }

  const embeddings: AlgoKitExample[] = await response.json();
  console.log(`✓ Loaded ${embeddings.length} examples`);

  // Create or replace the table
  try {
    // Drop existing table if it exists
    try {
      await db.dropTable('examples');
      console.log('Dropped existing table');
    } catch {
      // Table doesn't exist, that's fine
    }

    // Create new table with embeddings
    examplesTable = await db.createTable('examples', embeddings);
    console.log('✓ Created examples table');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }

  return examplesTable;
}

/**
 * Get the examples table (must call initializeDatabase first)
 */
export function getTable(): Table {
  if (!examplesTable) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return examplesTable;
}

/**
 * Check if database is initialized
 */
export function isInitialized(): boolean {
  return examplesTable !== null;
}