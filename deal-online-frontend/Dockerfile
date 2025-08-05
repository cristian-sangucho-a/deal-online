# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set build-time environment variables for Astro
ARG PUBLIC_API_URL
ARG PUBLIC_WS_URL
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG NODE_ENV=production
ARG DEBUG=false

ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_WS_URL=$PUBLIC_WS_URL
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY
ENV NODE_ENV=$NODE_ENV
ENV DEBUG=$DEBUG

# Build the application
RUN npm run build

# Production stage - Run the Node.js server
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# These will be set by Cloud Run
ENV PUBLIC_API_URL=""
ENV PUBLIC_WS_URL=""
ENV PUBLIC_SUPABASE_URL=""
ENV PUBLIC_SUPABASE_ANON_KEY=""
ENV DEBUG="false"

# Expose port 3000 (Astro Node.js server default)
EXPOSE 3000

# Start the Astro Node.js server
CMD ["node", "./dist/server/entry.mjs"]
