FROM node:20-alpine AS base

FROM base AS build
RUN npm i -g pnpm
COPY . /project
WORKDIR /project
RUN --mount=type=cache,target=/project/node_modules pnpm i && pnpm run build

FROM base
COPY --from=build /project/build /project
RUN adduser -D weird
RUN echo '{"type": "module"}' > /project/package.json
RUN chown -R weird:weird /project
USER weird
CMD ["node", "/project"]
