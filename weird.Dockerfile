FROM node:20-alpine AS build

# Add certificate and uncomment if building behind proxy with custom cert
# COPY ./gitignore/ca-certificates.crt /etc/ssl/cert.pem

ENV NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem
RUN apk add python3 make g++ --no-cache
RUN npm i -g pnpm
COPY . /project
WORKDIR /project
RUN --mount=type=cache,target=/project/node_modules pnpm i && pnpm run build && mv build /build
RUN cp -r package.json pnpm-lock.yaml patches /build
RUN cd /build && pnpm install --prod

FROM node:20-alpine
COPY --from=build /build /project
RUN adduser -D weird
RUN chown -R weird:weird /project
USER weird
CMD ["node", "/project"]
