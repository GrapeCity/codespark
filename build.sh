#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

echo "==== Now building codespark-site at $(pwd) ====="
docker build -t codespark-site:1.0-$BUILD_VERSION -f site/Dockerfile .

echo "==== Now building codespark-service at $(pwd) ====="
docker build -t codespark-service:1.0-$BUILD_VERSION -f service/Dockerfile .

echo "==== Now building codespark-management at $(pwd) ====="
docker build -t codespark-management:1.0-$BUILD_VERSION -f management/Dockerfile .

echo "==== Now building codespark-runner-js at $(pwd) ====="
docker build -t codespark-runner-js:1.0-$BUILD_VERSION -f judge/runner/javascript/Dockerfile .