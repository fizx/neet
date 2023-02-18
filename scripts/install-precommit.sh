#!/bin/bash

# Install the husky package as a dev dependency
yarn add husky --dev

npx husky install

# Configure the pre-commit hook
npx husky add .husky/pre-commit "yarn run pre-commit"

# Output success message
echo "Pre-commit hooks configured successfully."
