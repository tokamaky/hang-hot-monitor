#!/bin/sh

# Replace environment variables in nginx.conf
sed -i "s|\${VITE_API_URL}|${VITE_API_URL}|g" /etc/nginx/conf.d/default.conf

# Execute CMD
exec "$@"
