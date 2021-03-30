#!/bin/bash -eu

node_modules/.bin/eslint --fix public/src/*.js
node_modules/.bin/eslint --fix public/src/**/*.js
