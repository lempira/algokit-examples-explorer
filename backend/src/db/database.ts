/**
 * LanceDB database service for backend
 *
 * Handles initialization, loading embeddings, and table management.
 * Uses file-based persistence for LanceDB native Rust bindings.
 */

import * as lancedb from '@lancedb/lancedb'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Table } from '@lancedb/lancedb'
import { examplesSchema, type AlgoKitExample } from './models.js'

let db: lancedb.Connection | null = null
let examplesTable: Table | null = null

/**
 * Initialize LanceDB connection and load embeddings from JSON file
 *
 * This should be called once on server startup.
 */
export async function initializeDatabase(): Promise<void> {
  if (examplesTable) {
    console.log('Database already initialized')
    return
  }

  try {
    console.log('Initializing LanceDB...')

    // Connect to LanceDB with file-based persistence
    const dbPath = join(process.cwd(), 'data', 'algokit-examples-db')
    db = await lancedb.connect(dbPath)
    console.log(`✓ Connected to LanceDB at ${dbPath}`)

    // Load embeddings from JSON file
    const embeddingsPath = join(process.cwd(), 'data', 'embeddings.json')
    console.log(`Loading embeddings from ${embeddingsPath}...`)

    let embeddings: AlgoKitExample[]
    try {
      const embeddingsData = readFileSync(embeddingsPath, 'utf-8')
      embeddings = JSON.parse(embeddingsData)
    } catch (error) {
      throw new Error(
        `Failed to read embeddings file: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    if (!Array.isArray(embeddings) || embeddings.length === 0) {
      throw new Error('Embeddings file is empty or invalid')
    }

    console.log(`✓ Loaded ${embeddings.length} examples from embeddings.json`)

    // Create table with overwrite mode and explicit schema
    // Explicit schema required to handle empty arrays properly
    examplesTable = await db.createTable('examples', embeddings as any, {
      mode: 'overwrite',
      schema: examplesSchema
    })

    console.log('✓ Created examples table in LanceDB')
    console.log(`✓ Database initialized with ${embeddings.length} examples`)

  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * Get the examples table for querying
 *
 * @throws Error if database is not initialized
 */
export function getTable(): Table {
  if (!examplesTable) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return examplesTable
}

/**
 * Check if database is initialized
 */
export function isInitialized(): boolean {
  return examplesTable !== null
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{ count: number }> {
  if (!examplesTable) {
    throw new Error('Database not initialized')
  }

  const count = await examplesTable.countRows()
  return { count }
}