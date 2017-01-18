#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

docker run -d \
    --name service1 \
    --restart=always \
    --link mongo:mongo \
    --link redis:redis \
    -e REDIS_PASSWORD=xA123456 \
    -v $(pwd)/conf/service:/app/conf \
    codespark-service:1.0-$BUILD_VERSION

docker run -d \
    --name service2 \
    --restart=always \
    --link mongo:mongo \
    --link redis:redis \
    -e REDIS_PASSWORD=xA123456 \
    -v $(pwd)/conf/service:/app/conf \
    codespark-service:1.0-$BUILD_VERSION