ARG NODE_IMAGE=node:26.13.1-trixie-slim@sha256:abe7e5a82b61a8ef67b315b85497c9e65173387ccf2f4a029248184b8e020be5

FROM ${NODE_IMAGE} AS pnpm
ENV CI=true
WORKDIR /app
COPY package.json ./
RUN npm install --global "$(node -p "require('./package.json').packageManager")"

FROM pnpm AS native-build
RUN apt-get update \
  && apt-get install --yes --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/

FROM native-build AS workspace
RUN pnpm install --frozen-lockfile
COPY . .

FROM workspace AS api-build
RUN pnpm --filter @imc-calculator/backend build

FROM native-build AS api-dependencies
RUN pnpm install --frozen-lockfile --prod --filter @imc-calculator/backend

FROM workspace AS panel-build
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_BUILD_OUTPUT=standalone
RUN pnpm --filter @imc-calculator/frontend build

FROM ${NODE_IMAGE} AS api
ENV NODE_ENV=production PORT=3333 DB_DATABASE=/data/database.sqlite
WORKDIR /app
COPY --from=api-dependencies /app/node_modules ./node_modules
COPY --from=api-dependencies /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=api-build /app/apps/backend/dist ./apps/backend/dist
COPY apps/backend/package.json apps/backend/docker-entrypoint.sh ./apps/backend/
RUN mkdir /data && chown node:node /data
USER node
WORKDIR /app/apps/backend
VOLUME /data
EXPOSE 3333
ENTRYPOINT ["sh", "docker-entrypoint.sh"]

FROM ${NODE_IMAGE} AS panel
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=panel-build /app/apps/frontend/.next/standalone ./
COPY --from=panel-build /app/apps/frontend/.next/static ./apps/frontend/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
