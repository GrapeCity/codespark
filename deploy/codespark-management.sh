#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

docker run -d \
    --name management \
    --link mongo:mongo \
    --link redis:redis \
    -v $(pwd)/conf/service:/app/conf \
    codespark-management:1.0-$BUILD_VERSION