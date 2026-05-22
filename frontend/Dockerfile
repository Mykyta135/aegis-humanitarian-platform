# ---- Dependencies Stage ----
    FROM node:20.11.1-alpine AS dependencies
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm install
    
    # ---- Build Stage ----
    FROM dependencies AS builder
    COPY . .
    # These ARG values are passed in from docker-compose.yml
    ARG NEXT_PUBLIC_API_BASE_URL
    ARG NEXT_PUBLIC_MAPTILER_API_KEY
    RUN npm run build
    
    # ---- Production Stage ----
    FROM node:20.11.1-alpine AS runner
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    # Copy the optimized, standalone server from the builder stage
    COPY --from=builder /app/.next/standalone ./
    # Copy static assets
    COPY --from=builder /app/.next/static ./.next/static
    # Copy public assets
    COPY --from=builder /app/public ./public
    
    EXPOSE 3001
    
    # Command to run the optimized server
    CMD ["node", "server.js"]