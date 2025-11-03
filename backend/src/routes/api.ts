/**
 * API route definitions
 *
 * Exposes search and retrieval endpoints with schema validation.
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { searchExamples, getExampleById } from '../services/search.js'
import { isInitialized as isDbInitialized, getDatabaseStats } from '../db/database.js'
import { isInitialized as isEmbedderInitialized } from '../services/embedder.js'
import {
  SearchRequestSchema,
  SearchResponseSchema,
  AlgoKitExampleSchema,
  ExampleIdParamsSchema,
  HealthResponseSchema,
  ErrorResponseSchema
} from '../schemas/search.js'

/**
 * Register all API routes under /api prefix
 */
export async function apiRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  /**
   * POST /api/search
   *
   * Perform semantic search over AlgoKit examples
   */
  fastify.post('/search', {
    schema: {
      description: 'Search AlgoKit examples using semantic similarity',
      tags: ['search'],
      body: SearchRequestSchema,
      response: {
        200: SearchResponseSchema,
        400: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    const { query, limit } = request.body as { query: string; limit?: number }

    try {
      fastify.log.info({ query, limit }, 'Search request received')
      const results = await searchExamples(query, limit)
      fastify.log.info({ count: results.count, processingTimeMs: results.processingTimeMs }, 'Search completed')
      return results
    } catch (error) {
      fastify.log.error({ error, query }, 'Search failed')
      reply.code(500)
      return {
        statusCode: 500,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Search query failed'
      }
    }
  })

  /**
   * GET /api/examples/:id
   *
   * Retrieve a single AlgoKit example by ID
   */
  fastify.get('/examples/:id', {
    schema: {
      description: 'Get a specific AlgoKit example by ID',
      tags: ['examples'],
      params: ExampleIdParamsSchema,
      response: {
        200: AlgoKitExampleSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      fastify.log.info({ exampleId: id }, 'Get example request received')
      const example = await getExampleById(id)

      if (!example) {
        fastify.log.info({ exampleId: id }, 'Example not found')
        reply.code(404)
        return {
          statusCode: 404,
          error: 'Not Found',
          message: `Example with ID '${id}' not found`
        }
      }

      fastify.log.info({ exampleId: id }, 'Example retrieved')
      return example
    } catch (error) {
      fastify.log.error({ error, exampleId: id }, 'Get example failed')
      reply.code(500)
      return {
        statusCode: 500,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve example'
      }
    }
  })

  /**
   * GET /api/health
   *
   * Health check endpoint with service status
   */
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: HealthResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const dbInitialized = isDbInitialized()
      const embedderInitialized = isEmbedderInitialized()

      let examplesCount = 0
      if (dbInitialized) {
        try {
          const stats = await getDatabaseStats()
          examplesCount = stats.count
        } catch (error) {
          fastify.log.warn({ error }, 'Failed to get database stats')
        }
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: dbInitialized,
          embedder: embedderInitialized
        },
        examplesCount
      }
    } catch (error) {
      fastify.log.error({ error }, 'Health check failed')
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: false,
          embedder: false
        },
        examplesCount: 0
      }
    }
  })
}