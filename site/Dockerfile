FROM nginx:1.10.2

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SITE_VERSION 1.0~nginx1.10.2
ENV NODE_VERSION 6.9.2

WORKDIR /site
COPY . /site

RUN apt-get update -qq \
    && apt-get install -y curl apt-utils build-essential \
    && cp -f conf/nginx.conf /etc/nginx/nginx.conf \
    && cp -R -f conf/conf.d/* /etc/nginx/conf.d/ \
    && set -ex \
    && for key in \
        9554F04D7259F04124DE6B476D5A82AC7E37093B \
        94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
        0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
        FD3A5288F042B6850C66B31F09FE44734EB7990E \
        71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
        DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
        B9AE9905FFD7803F25714661B63B535A4C206CA9 \
        C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
    done \
    && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
    && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
    && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
    && npm install -g gulp-cli \
    && npm install \
    && gulp \
    && rm -rf /usr/share/nginx/html \
    && ln -s /site/dist /usr/share/nginx/html \
    && npm uninstall -g gulp-cli \
    && npm cache clean \
    && apt-get remove -y curl apt-utils build-essential \
    && apt-get autoremove -y \
    && rm -rf node_modules \
    && rm /usr/local/CHANGELOG.md /usr/local/LICENSE /usr/local/README.md \
    && rm /usr/local/bin/node /usr/local/bin/nodejs /usr/local/bin/npm \
    && rm -rf /usr/local/include/node \
    && rm -rf /usr/local/lib/node_modules \
    && rm -rf /usr/local/share/doc/node \
    && rm -rf /usr/local/share/man/man1/node.1 \
    && rm -rf /usr/local/share/systemtap/tapset/node.stp \
    && rm -rf /tmp \
    && rm -rf ~/.cache \
    && rm -rf ~/.node-gyp \
    && rm -rf /var/lib/apt/lists/*
