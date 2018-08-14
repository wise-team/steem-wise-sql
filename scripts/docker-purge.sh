#!/usr/bin/env bash
##
# This script removes docker containers, volumes and networks associated with this compose
##
set -x

docker-compose down
docker volume rm steem-wise-sql_pgdata
docker volume rm steemwisesql_pgdata # these names may vary in different docker versions

