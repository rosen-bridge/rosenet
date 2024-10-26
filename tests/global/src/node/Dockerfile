FROM node:20-slim AS base
WORKDIR /app
COPY . /app

FROM base as build
RUN --mount=type=cache,target=/root/.npm npm i
RUN npm run build

FROM base as prod-deps
RUN --mount=type=cache,target=/root/.npm npm i --omit=dev
RUN mkdir -p /app/packages/rosenet-node/node_modules
RUN mkdir -p /app/packages/utils/node_modules
RUN mkdir -p /app/tests/global/node_modules

FROM base
COPY --from=build /app/packages/rosenet-node/dist /app/packages/rosenet-node/dist
COPY --from=build /app/packages/utils/dist /app/packages/utils/dist
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/packages/rosenet-node/node_modules /app/packages/rosenet-node/node_modules
COPY --from=prod-deps /app/packages/utils/node_modules /app/packages/utils/node_modules
COPY --from=prod-deps /app/tests/global/node_modules /app/tests/global/node_modules
WORKDIR /app/tests/global

CMD npm run start:node
