FROM node:20.11

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY packages/rosenet-node/package.json ./packages/rosenet-node/
COPY packages/rosenet-relay/package.json ./packages/rosenet-relay/
COPY packages/utils/package.json ./packages/utils/
COPY tests/simple-star/package.json ./tests/simple-star/
RUN npm i

COPY . .
RUN npm run build

WORKDIR /app/tests/simple-star

CMD npm run start:relay
