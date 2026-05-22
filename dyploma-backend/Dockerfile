# File: dyploma/dyploma-backend/Dockerfile

# ---- Base Stage ----
# Use a specific Node.js version for consistency
FROM node:20.11.1-alpine AS base
WORKDIR /app
# Copy package files first to leverage Docker cache
COPY package.json package-lock.json ./

# ---- Dependencies Stage ----
# Install ALL dependencies needed for the build
FROM base AS dependencies
RUN npm install

# ---- Build Stage ----
# Build the TypeScript application
FROM dependencies AS builder
COPY . .
RUN npm run build

# ---- Production Stage ----
# This is the final, lightweight image
FROM base AS production
# Copy only the production dependencies from the 'dependencies' stage
COPY --from=dependencies /app/node_modules ./node_modules
# Copy the compiled code from the 'builder' stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]