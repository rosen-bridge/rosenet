FROM public.ecr.aws/docker/library/node:20.11

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY packages/rosenet-node/package.json ./packages/rosenet-node/
COPY packages/rosenet-relay/package.json ./packages/rosenet-relay/
COPY packages/utils/package.json ./packages/utils/
COPY tests/scale/package.json ./tests/scale/
RUN npm ci

COPY . .
RUN npm run build

WORKDIR /app/tests/scale

CMD npm run start:relay
