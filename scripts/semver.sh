#!/usr/bin/env bash
set -e # fail on first error
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.." # parent dir of scripts dir
cd "${DIR}"

VERSION=$1

if [ -z "${VERSION}" ]; then
    echo "You must specify new version"
    exit 1
fi


REQUIRED_BRANCH="master"
if [ "$(git rev-parse --abbrev-ref HEAD)" != "${REQUIRED_BRANCH}" ]; then
    echo "You must be on a \"${REQUIRED_BRANCH}\" branch to do semver"
    exit 1
fi


echo "Updating steem-wise-core to ${VERSION}"
node -e " \
var packageFileContents = require(\"./pusher/package.json\"); \
packageFileContents.version = \"${VERSION}\"; \
packageFileContents.dependencies[\"steem-wise-core\"] = \"^${VERSION}\"; \
require('fs').writeFileSync(\"./pusher/package.json\", JSON.stringify(packageFileContents, null, 2), \"utf8\"); \
"
echo "Updating version succeeded"

cd "${DIR}/pusher"
echo "Building pusher..."
npm install
npm run build
echo "Pusher build successful"

cd "${DIR}"

echo "Creating git tag"
git add "${DIR}/pusher/package.json" "${DIR}/pusher/package-lock.json"
git commit -m "Semver ${VERSION}"
git push
git tag -a "v${VERSION}" -m "Steem wiseSQL version ${VERSION}"
git push --tags
echo "Done creating tag"

