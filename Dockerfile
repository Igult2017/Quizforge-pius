# hadolint ignore=DL3041
ARG FIREBASE_API_KEY
# hadolint ignore=DL3041
ARG FIREBASE_AUTH_DOMAIN
# hadolint ignore=DL3041
ARG VITE_FIREBASE_API_KEY
# hadolint ignore=DL3041
ARG VITE_FIREBASE_AUTH_DOMAIN
# hadolint ignore=DL3041
ARG PESAPAL_CONSUMER_KEY
# hadolint ignore=DL3041
ARG PESAPAL_CONSUMER_SECRET
# hadolint ignore=DL3041
ARG GEMINI_API_KEY
# hadolint ignore=DL3041
ARG DATABASE_URL

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]
