FROM node:20-alpine AS build
RUN npm i -g pnpm
COPY . /project
WORKDIR /project
RUN --mount=type=cache,target=/project/node_modules pnpm i && pnpm run build

FROM node:20-alpine
RUN npm i -g pnpm
RUN adduser -D weird
COPY --from=build /project/build /project
COPY --from=build /project/package.json /project/package.json
COPY --from=build /project/pnpm-lock.yaml /project/pnpm-lock.yaml
RUN cd /project && pnpm install --prod
RUN chown -R weird:weird /project
USER weird
CMD ["node", "/project"]
