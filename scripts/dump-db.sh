#!/usr/bin/env bash
##
# This script dumps SQL from inside a running container.
##
set -x
set -e

mkdir -p backup
docker exec steem-wise-sql_db bash -c "PGPASSWORD=\"postgres\" pg_dump --username=postgres app_db" > "backup/steem-wise-sql-dump-$(date +"%Y_%m_%d_%I_%M_%p").sql"
