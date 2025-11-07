# Multi-stage build for AlgoKit Examples Frontend (SolidStart)
# Optimized for Google Cloud Run deployment

# ============================================
# Stage 1: Build Static Assets
# ============================================
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for backend API URL
# This is set at build time and baked into the JavaScript bundle
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the SolidStart application
# This creates .output/ directory with:
#   - .output/public/ (static HTML, JS, CSS)
#   - .output/server/index.mjs (Node.js server to serve the app)
RUN npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies (excludes devDependencies)
RUN npm ci --omit=dev

# Copy the production build output from builder stage
# .output/ contains everything needed to run the app
COPY --from=builder /app/.output ./.output

# Environment variables for Cloud Run
ENV NODE_ENV=production
# Cloud Run requires listening on PORT env var (defaults to 8080)
ENV PORT=8080
ENV HOST=0.0.0.0
# Nitro (used by vinxi/SolidStart) uses NITRO_PORT
ENV NITRO_PORT=8080
ENV NITRO_HOST=0.0.0.0

# Document the port (Cloud Run will override this)
EXPOSE 8080

# Note: Cloud Run provides automatic health checks by pinging the root path /

# Start the production server using npm start (which runs vinxi start)
CMD ["npm", "run", "start"]