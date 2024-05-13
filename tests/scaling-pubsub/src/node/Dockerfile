FROM node:20.11

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY packages/rosenet-node/package.json ./packages/rosenet-node/
COPY packages/rosenet-relay/package.json ./packages/rosenet-relay/
COPY packages/utils/package.json ./packages/utils/
COPY tests/scaling-pubsub/package.json ./tests/scaling-pubsub/
RUN npm ci

COPY . .
RUN npm run build

WORKDIR /app/tests/scaling-pubsub

CMD npm run start:node
