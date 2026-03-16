FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

ARG MONGO_URL
ARG MONGO_DB_NAME
ARG JWT_SECRET
ARG APP_USERNAME
ARG APP_PASSWORD

ENV MONGO_URL=${MONGO_URL}
ENV MONGO_DB_NAME=${MONGO_DB_NAME}
ENV JWT_SECRET=${JWT_SECRET}
ENV APP_USERNAME=${APP_USERNAME}
ENV APP_PASSWORD=${APP_PASSWORD}

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
