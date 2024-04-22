FROM node:20.11

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY packages/rosenet-node/package.json ./packages/rosenet-node/
COPY packages/rosenet-relay/package.json ./packages/rosenet-relay/
COPY packages/utils/package.json ./packages/utils/
COPY tests/scaling-peer-discovery/package.json ./tests/scaling-peer-discovery/
RUN npm ci

COPY . .
RUN npm run build

WORKDIR /app/tests/scaling-peer-discovery

CMD npm run start:node
