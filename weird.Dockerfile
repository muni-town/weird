FROM node:20-alpine AS base

FROM base AS build

RUN npm i -g pnpm
COPY . /project
WORKDIR /project
# This is necessary to run sharp
RUN npm install -g --arch=x64 --platform=linux --libc=glibc sharp@0.33.5
RUN --mount=type=cache,target=/project/node_modules pnpm i && npm rebuild --arch=x64 --platform=linux --libc=musl sharp && pnpm run build

FROM node:20-alpine
COPY --from=build /project/build /project
RUN adduser -D weird
RUN echo '{"type": "module"}' > /project/package.json
RUN chown -R weird:weird /project
USER weird
CMD ["node", "/project"]
