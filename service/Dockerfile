FROM node:4.6.2

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SERVICE_VERSION 1.0~node4.6.2

WORKDIR /app
VOLUME /app/conf
COPY . /app

# Install basic requirements and clean up cache folders
RUN apt-get update -qq \
    && apt-get install -y apt-utils build-essential \
    && npm install --production \
    && npm cache clean \
    && rm -rf /tmp \
    && rm -rf ~/.cache \
    && rm -rf ~/.node-gyp \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
EXPOSE 5000
CMD [ "node", "app.js" ]