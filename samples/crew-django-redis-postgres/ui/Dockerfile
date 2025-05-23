# Simple Dockerfile for Next.js App Router (production)
FROM node:20-slim
WORKDIR /app
# Only copy dependency manifests first for better build caching
COPY package.json package-lock.json* ./
RUN npm ci
# Now copy the rest of the app
COPY . .

# Allow API URL to be set at build time, fallback to runtime env or default
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
