#!/usr/bin/env bash
##
# This script removes docker containers, volumes and networks associated with this compose
##
set -x
set -e

docker-compose down
docker volume rm steem-wise-sql_pgdata
