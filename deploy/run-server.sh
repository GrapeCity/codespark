#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

./codespark-mongo.sh $BUILD_VERSION
./codespark-redis.sh $BUILD_VERSION
./codespark-service.sh $BUILD_VERSION
./codespark-site.sh $BUILD_VERSION
./codespark-management.sh $BUILD_VERSION