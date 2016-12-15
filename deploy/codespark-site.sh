#!/bin/sh

docker run -d \
    --name site \
    codespark-site:1.0-$(date +"%Y%m%d")