#!/bin/bash -eu

dir=$(pwd)
cd bundle
if [ -f bundle ]; then
  rm bundle
fi
go build -o bundle
if [ -f bundle ]; then
  ./bundle "$dir"
fi
cd ..
