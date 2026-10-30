# Build the React client
FROM node:20-bookworm-slim AS client
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Empty API URL: the client calls the server on its own origin
ENV REACT_APP_API_URL=""
RUN npm run build

# Run the API server, which also serves the built client
FROM node:20-bookworm-slim
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=client /client/build ./public
EXPOSE 3010
CMD ["node", "index.js"]
