import Fastify from 'fastify'
import cors from '@fastify/cors'
import { initializeDatabase } from './db/database.js'
import { initializeEmbedder } from './services/embedder.js'
import { apiRoutes } from './routes/api.js'

async function buildServer() {
  const fastify = Fastify({
    logger: true // Built-in Pino logging
  })

  // Register CORS plugin
  await fastify.register(cors, {
    origin: ['http://localhost:3000'] // Frontend development URL
  })

  // Initialize services on startup
  console.log('\n--- Initializing Services ---')
  await initializeDatabase()
  await initializeEmbedder()
  console.log('--- Services Ready ---\n')

  // Register API routes
  await fastify.register(apiRoutes, { prefix: '/api' })

  // Custom error handler for consistent error responses
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error)

    // Validation errors (400)
    if (error.validation) {
      reply.code(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message
      })
      return
    }

    // Server errors (500)
    reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    })
  })

  return fastify
}

async function start() {
  try {
    const server = await buildServer()
    await server.listen({ port: 3001, host: '0.0.0.0' })
    console.log('✓ Server listening on http://localhost:3001')
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()