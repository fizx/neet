#!/bin/bash
cd `dirname $0`/..
npx esbuild --format=cjs --bundle home/index.ts > neet.js