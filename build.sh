#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

echo "==== Now building codespark-site at $(pwd) ====="
docker build -t codespark-site:2.0-$BUILD_VERSION -f site/Dockerfile .

echo "==== Now building codespark-service at $(pwd) ====="
docker build -t codespark-service:2.0-$BUILD_VERSION -f service/Dockerfile .

echo "==== Now building codespark-management at $(pwd) ====="
docker build -t codespark-management:2.0-$BUILD_VERSION -f management/Dockerfile .

echo "==== Now building codespark-judge-agent at $(pwd) ====="
docker build -t codespark-judge-agent:2.0-$BUILD_VERSION -f judge/agent/linuxcontainer/Dockerfile .

echo "==== Now building codespark-judge-javascript at $(pwd) ====="
docker build -t codespark-judge-javascript:2.0-$BUILD_VERSION -f judge/runner/javascript/Dockerfile .