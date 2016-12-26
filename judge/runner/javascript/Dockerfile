FROM node:6.9.2

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SERVICE_VERSION 1.0~node6.9.2

WORKDIR /app
VOLUME /app/data
COPY ./judge/runner/javascript /app

RUN npm install --production

CMD [ "node", "index.js" ]