#!/bin/sh

BUILD_VERSION=$2
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

force_remove_container() {
  local CONTAINER="$1"
  local RUNNING=$(docker inspect --format="{{ .State.Running }}" $CONTAINER 2> /dev/null)
  if [ "$RUNNING" = "true" ]; then
    docker rm -f $CONTAINER
  fi
}

remove_image() {
  local IMAGE="$1"
  local STATE=$(docker images -q $IMAGE 2> /dev/null)
  if [ ! -z "$STATE" ]; then
    docker rmi $IMAGE
  fi
}

force_remove_container "site"
force_remove_container "service1"
force_remove_container "service2"
force_remove_container "management"
force_remove_container "agent"

DROP_IMAGES=$1
if [ ! -z "DROP_IMAGES" ]
then
    remove_image "codespark-management:1.0-$BUILD_VERSION"
    remove_image "codespark-service:1.0-$BUILD_VERSION"
    remove_image "codespark-site:1.0-$BUILD_VERSION"
    remove_image "codespark-runner-agent:1.0-$BUILD_VERSION"
    remove_image "codespark-runner-javascript:1.0-$BUILD_VERSION"
fi