import Fastify from 'fastify'
import cors from '@fastify/cors'
import { initializeDatabase } from './services/database.js'
import { initializeEmbedder } from './services/embedder.js'

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

  // TODO: Register API routes

  // Basic health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
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