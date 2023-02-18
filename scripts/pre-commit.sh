#!/bin/bash
set -ex
echo 'Running pre-commit hooks...'
yarn run lint --fix
yarn run prettier --write 

./scripts/build-homepage.sh