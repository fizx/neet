#!/bin/bash
set -ex
echo 'Running pre-commit hooks...'
yarn run lint --fix
yarn run prettier --write 
yarn build