#!/bin/bash -eu

dir='../scroll-and-sigil-website'

cp --archive public "$dir"
cd "$dir"

mv public/index.html game.html
mv public/* ./.
rm -r public
