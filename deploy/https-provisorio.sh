#!/usr/bin/env bash
# Pone HTTPS en el servidor con un certificado hecho aca mismo, para poder
# mudar el dominio sin que se caiga el candadito ni un segundo.
#
# Por que sirve un certificado propio: Cloudflare esta en modo "Completo".
# Eso quiere decir que cifra contra este servidor pero no exige que el
# certificado lo firme una autoridad conocida. El visitante nunca lo ve: ve
# el de Cloudflare, que si es valido. Asi se puede apuntar el dominio aca
# antes de tener el de Let's Encrypt, que recien se puede pedir cuando el
# dominio YA apunta aca. Sin esto hay que elegir entre un rato sin candadito
# o un rato con el trafico sin cifrar, y ninguna de las dos hace falta.
#
# Despues, con el dominio ya mudado:
#   sudo certbot --nginx -d conesa.com.ar -d www.conesa.com.ar
# reemplaza este certificado por uno de verdad, y recien ahi conviene pasar
# Cloudflare a "Completo (estricto)".
#
#   sudo bash https-provisorio.sh

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

CRT=/etc/ssl/certs/conesa-provisorio.crt
KEY=/etc/ssl/private/conesa-provisorio.key
SITIO=/etc/nginx/sites-available/conesa

if [ -f "$CRT" ]; then
  echo "El certificado provisorio ya existia"
else
  openssl req -x509 -newkey rsa:2048 -nodes -days 90 \
    -keyout "$KEY" -out "$CRT" -subj "/CN=conesa.com.ar" 2>/dev/null
  chmod 600 "$KEY"
  echo "Certificado provisorio generado"
fi

if grep -q "listen 443" "$SITIO"; then
  echo "nginx ya tenia el puerto 443 configurado: no se toca"
else
  cat >> "$SITIO" <<NGINX

# HTTPS provisorio. certbot reemplaza estas dos lineas por el certificado de
# verdad cuando el dominio ya apunte a esta maquina.
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name conesa.com.ar www.conesa.com.ar;

    ssl_certificate     $CRT;
    ssl_certificate_key $KEY;

    client_max_body_size 20m;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /api/productos/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        add_header Cache-Control "public, max-age=86400";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
NGINX
  echo "Bloque HTTPS agregado a nginx"
fi

nginx -t >/dev/null && systemctl reload nginx
echo "Listo: el servidor ya atiende el puerto 443."
