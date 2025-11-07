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
  // Allow frontend from localhost (dev) or any Cloud Run domain (*.run.app)
  await fastify.register(cors, {
    origin: [
      'http://localhost:3000',        // Local development
      /^https:\/\/.*\.run\.app$/      // Any Cloud Run domain
    ]
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

    // Use PORT and HOST from environment variables (Cloud Run compatibility)
    const port = Number(process.env.PORT) || 3001
    const host = process.env.HOST || '0.0.0.0'

    await server.listen({ port, host })
    console.log(`✓ Server listening on http://${host}:${port}`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()