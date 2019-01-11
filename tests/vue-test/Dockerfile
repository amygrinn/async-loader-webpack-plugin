# Build
FROM node:10.13 AS build
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .
RUN yarn build

# Serve
FROM node:10.13-alpine AS serve
WORKDIR /app

ENV NODE_ENV production
ENV PORT 80
EXPOSE 80

COPY package.json ./
COPY yarn.lock ./

RUN apk add --no-cache --virtual .build-deps alpine-sdk python \
 && yarn install --production \
 && apk del .build-deps alpine-sdk python

COPY --from=build /app/dist ./dist

CMD [ "node", "server" ]
