FROM node:20.11-slim AS base
WORKDIR /app
COPY . /app

FROM base AS build
RUN --mount=type=cache,target=/root/.npm npm i
RUN npm run build

FROM base AS prod-deps
RUN --mount=type=cache,target=/root/.npm npm i --omit=dev
RUN mkdir -p /app/packages/rosenet-relay/node_modules
RUN mkdir -p /app/packages/utils/node_modules
RUN mkdir -p /app/services/relay/node_modules

FROM base
COPY --from=build /app/packages/rosenet-relay /app/packages/rosenet-relay
COPY --from=build /app/packages/utils/dist /app/packages/utils/dist
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/packages/rosenet-relay/node_modules /app/packages/rosenet-relay/node_modules
COPY --from=prod-deps /app/packages/utils/node_modules /app/packages/utils/node_modules
COPY --from=prod-deps /app/services/relay/node_modules /app/services/relay/node_modules
WORKDIR /app/services/relay/

CMD ["npm", "run", "start"]
