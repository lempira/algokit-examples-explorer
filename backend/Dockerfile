# Multi-stage build for AlgoKit Examples Backend
# Optimized for Google Cloud Run deployment

# ============================================
# Stage 1: Build TypeScript Application
# ============================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

# Compile TypeScript to JavaScript in dist/ directory
RUN npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (excludes TypeScript, tsx, etc.)
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Copy embeddings data (required for LanceDB initialization)
COPY --from=builder /app/data ./data

# Create cache directory for ML models
RUN mkdir -p /app/.cache

# Set cache location for @xenova/transformers
ENV TRANSFORMERS_CACHE=/app/.cache

# Pre-download the ML model during build (all-MiniLM-L6-v2, ~90MB)
# This prevents ~15 second cold start delay on first request
# The model is used by @xenova/transformers for generating query embeddings
RUN node -e "const {pipeline} = require('@xenova/transformers'); \
  pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') \
  .then(() => {console.log('Model downloaded successfully'); process.exit(0)}) \
  .catch(err => {console.error('Model download failed:', err); process.exit(1)})"

# Environment variables for Cloud Run
ENV NODE_ENV=production
# Cloud Run requires listening on PORT env var (defaults to 8080)
ENV PORT=8080
# Listen on all interfaces to accept external connections
ENV HOST=0.0.0.0

# Document the port (Cloud Run will override this)
EXPOSE 8080

# Note: Cloud Run provides its own health checks via /api/health endpoint
# No Docker HEALTHCHECK needed as Cloud Run ignores it

# Start the Fastify server
CMD ["node", "dist/index.js"]