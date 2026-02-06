FROM caddy:alpine

COPY Caddyfile /etc/caddy/Caddyfile

COPY index.html /srv/
COPY style.css /srv/
COPY script.js /srv/
COPY assets/ /srv/assets/

EXPOSE 80 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
