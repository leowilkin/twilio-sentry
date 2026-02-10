FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
# Note: in Docker, env vars are injected by the platform/runtime,
# so --env-file is not used here.
