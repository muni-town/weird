FROM node:20 as build
RUN npm i -g pnpm
COPY . /project
WORKDIR /project
RUN pnpm i && pnpm run build

FROM node:20
COPY --from=build /project/build /project
RUN useradd weird
RUN echo '{"type": "module"}' > /project/package.json
RUN chown -R weird:weird /project 
USER weird
CMD ["node", "/project"]
