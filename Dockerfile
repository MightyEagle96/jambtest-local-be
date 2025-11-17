
# Use the official slim Node.js image (supports both amd64 and arm64)
FROM node:18-alpine AS runtime

# Set working directory
WORKDIR /app

# ---- Copy only what we actually need in production ----
# 1. package.json and package-lock.json (if you have it) – needed for npm install/ci
COPY package*.json ./

# 2. Install ONLY production dependencies (no devDependencies like TypeScript, etc.)
RUN npm ci --only=production

# 3. Copy the already-built dist folder
COPY dist ./dist

# Optional: if you have .env or other small runtime files
# COPY .env ./

# Expose the port your app runs on (default NestJS/Express is 3000)
EXPOSE 4000

# Use NODE_ENV=production for maximum performance and security
ENV NODE_ENV=production

# Start the app (adjust if your start script is different)
CMD ["node", "dist/app.js"]