#!/bin/sh
set -e

: "${API_BASE_URL:=/api}"

envsubst '${API_BASE_URL}' \
  < /usr/share/nginx/html/assets/env-config.js.template \
  > /usr/share/nginx/html/assets/env-config.js

exec "$@"
