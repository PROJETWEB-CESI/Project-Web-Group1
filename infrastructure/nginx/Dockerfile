FROM nginx:1.25-alpine

RUN mkdir -p /var/cache/nginx/static \
    && mkdir -p /etc/letsencrypt/live/novacampus.fr

COPY nginx.conf            /etc/nginx/nginx.conf
COPY proxy_params_common   /etc/nginx/proxy_params_common
COPY security_headers.conf /etc/nginx/security_headers.conf
