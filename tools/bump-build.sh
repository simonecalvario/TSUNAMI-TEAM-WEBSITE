#!/bin/sh
# Sets a new build id in every page (tt-build meta + ?v= on local CSS/JS) so open apps reload the new version.
set -e
cd "$(dirname "$0")/.."
B=$(date -u +%Y%m%d-%H%M%S)
for f in *.html; do
  sed -i -E "s/(name=\"tt-build\" content=\")[^\"]*/\1$B/; s/(assets\/(css|js)\/[a-z0-9-]+\.(css|js))\?v=[A-Za-z0-9-]+/\1?v=$B/g" "$f"
done
echo "build $B"
