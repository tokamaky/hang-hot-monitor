#!/bin/sh
sed -i "s/\${PORT}/${PORT:-8080}/g" /etc/nginx/conf.d/default.conf
exec "$@"
