#!/usr/bin/env bash
set -euo pipefail

shopt -s globstar
for file in public/src/**/*.js; do
  header="$(head "$file")"
  [ "$header" != '/* This Source Code Form is subject to the terms of the Mozilla Public' ] && echo "$file"
done
