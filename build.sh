#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

cd site
echo "==== Now building codespark-site at $(pwd) ====="
docker build -t codespark-site:1.0-$BUILD_VERSION .

cd ../service
echo "==== Now building codespark-service at $(pwd) ====="
docker build -t codespark-service:1.0-$BUILD_VERSION .

cd ../management
echo "==== Now building codespark-management at $(pwd) ====="
docker build -t codespark-management:1.0-$BUILD_VERSION .