#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

docker run -d \
    --name site \
    -p 80:80 \
    --restart=always \
    --link service1:service1 \
    --link service2:service2 \
    codespark-site:1.0-$BUILD_VERSION