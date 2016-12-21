FROM node:6.9.2

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SERVICE_VERSION 1.0~node6.9.2

WORKDIR /app
VOLUME /app/conf
COPY . /app

# Install basic requirements and clean up cache folders
RUN apt-get update -qq \
    && apt-get install -y apt-utils build-essential \
    && npm install --production \
    && npm cache clean \
    && apt-get remove -y apt-utils build-essential \
    && apt-get autoremove -y \
    && rm -rf /tmp \
    && rm -rf ~/.cache \
    && rm -rf ~/.node-gyp \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
EXPOSE 6000
CMD [ "node", "app.js" ]