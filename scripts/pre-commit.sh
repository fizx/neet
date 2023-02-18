#!/bin/bash
echo 'Running pre-commit hooks...'
yarn run lint --fix
yarn run prettier --write
yarn run build

./scripts/build-homepage.sh