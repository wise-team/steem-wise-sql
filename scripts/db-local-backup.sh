#!/usr/bin/env bash
##
# This script dumps SQL from inside a running container.
##
set -x
set -e

DATED_FILEPATH="/backup/wise/sql/wise-sql-dump-$(date +"%Y_%m_%d_%I_%M_%p").sql"
echo "${DATED_FILEPATH}"

mkdir -p /backup/wise/sql/

#§ 'docker exec ' + data.config.sql.docker.services.db.container + ' \\'
docker exec wise_sql_db \
     bash -c "PGPASSWORD=\"postgres\" pg_dump --username=postgres app_db" > "${DATED_FILEPATH}"

