#!/usr/bin/env bash
set -e # fail on first error
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
NAME="wise-sql monitoring(run-monitoring.sh)"


if [ -z "${SLACK_WEBHOOK_URL}" ]; then
    echo "$NAME: SLACK_WEBHOOK_URL env is not set"
    exit 1
fi

if [ -z "${WISE_ENVIRONMENT_TYPE}" ]; then
    echo "$NAME: WISE_ENVIRONMENT_TYPE env is not set"
    exit 1
fi

if [ -z "${SLACK_MENTIONS}" ]; then
    echo "$NAME: SLACK_MENTIONS env is not set"
    exit 1
fi

if [ -z "${WISE_SQL_URL}" ]; then
    echo "$NAME: WISE_SQL_URL env is not set"
    exit 1
fi

if [ -z "${STEEM_API_URL}" ]; then
    echo "$NAME: STEEM_API_URL env is not set"
    exit 1
fi

if [ -z "${FAILURE_NOTIFICATION_INTERVAL_S}" ]; then
    echo "$NAME: FAILURE_NOTIFICATION_INTERVAL_S env is not set"
    exit 1
fi

DATA_VOLUME="sql-monitoring-datavolume"

docker run --rm \
    --name "sql-monitoring" \
    -e "SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}" \
    -e "ENVIRONMENT_TYPE=${WISE_ENVIRONMENT_TYPE}" \
    -e "SLACK_MENTIONS=${SLACK_MENTIONS}" \
    -e "PROJECT_NAME=wise-sql" \
    -e "FAILURE_NOTIFICATION_INTERVAL_S=${FAILURE_NOTIFICATION_INTERVAL_S}" \
    -v "${DIR}:/spec" \
    -v "${DATA_VOLUME}:/data" \
    -e "WISE_SQL_URL=${WISE_SQL_URL}" \
    -e "STEEM_API_URL=${STEEM_API_URL}" \
    wiseteam/dockerized-mocha-slack-service-monitoring
