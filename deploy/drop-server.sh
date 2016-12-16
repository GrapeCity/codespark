#!/bin/sh

docker rm -f management
docker rm -f site
docker rm -f service1
docker rm -f service2

# don't drop basic database server
#docker rm -f redis
#docker rm -f mongo

BUILD_VERSION=$2
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

DROP_IMAGES=$1
if [ ! -z "DROP_IMAGES" ]
then
    docker rmi codespark-management:1.0-$BUILD_VERSION
    docker rmi codespark-service:1.0-$BUILD_VERSION
    docker rmi codespark-site:1.0-$BUILD_VERSION
fi