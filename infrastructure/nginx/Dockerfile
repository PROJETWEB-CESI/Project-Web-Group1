FROM nginx:1.25-alpine

RUN apk add --no-cache openssl \
    && mkdir -p /var/cache/nginx/static \
    && mkdir -p /etc/letsencrypt/live/novacampus.fr \
    && openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
       -keyout /etc/letsencrypt/live/novacampus.fr/privkey.pem \
       -out    /etc/letsencrypt/live/novacampus.fr/fullchain.pem \
       -subj   '/CN=novacampus.fr'

COPY nginx.conf            /etc/nginx/nginx.conf
COPY proxy_params_common   /etc/nginx/proxy_params_common
COPY security_headers.conf /etc/nginx/security_headers.conf
