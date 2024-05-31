FROM node:20-alpine
WORKDIR /app
ARG REACT_APP_API_URL=http://localhost:3010
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build"]