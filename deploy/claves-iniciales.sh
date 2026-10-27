#!/usr/bin/env bash
# Completa /etc/conesa.env con todo lo que se puede resolver sin pedirle
# nada a nadie: las dos claves del panel, el id de Analytics y el deposito
# donde van los respaldos.
#
# Las claves del panel se generan nuevas a proposito. Las viejas estuvieron
# en Railway durante el incidente del 21/10/2026, asi que mudarlas tal cual
# seria mudar el problema. Estas nacen aca y nunca pasaron por otro lado.
#
# Lo que NO toca: MercadoPago, Resend y Gemini. Esas son de terceros y hay
# que sacarlas de cada panel; van a mano.
#
#   sudo env GA=G-XXXXXXX BUCKET=mi-deposito bash claves-iniciales.sh

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

ENV=/etc/conesa.env
GA="${GA:-}"
BUCKET="${BUCKET:-}"

fijar() {
  local clave=$1 valor=$2
  if grep -q "^$clave=" "$ENV"; then
    sed -i "s|^$clave=.*|$clave=$valor|" "$ENV"
  else
    printf '%s=%s\n' "$clave" "$valor" >> "$ENV"
  fi
}

vacia() { ! grep -q "^$1=..*" "$ENV"; }

# La contrasena del panel queda ademas en su propio archivo que solo puede
# leer root. Es la unica forma de que el dueno la vea cuando la necesite sin
# que ande dando vueltas por un chat o por el historial de la terminal.
if vacia ADMIN_PASSWORD; then
  P=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 18)
  printf '%s\n' "$P" > /etc/conesa.admin-pass
  chmod 600 /etc/conesa.admin-pass
  fijar ADMIN_PASSWORD "$P"
  echo "  contrasena del panel generada  ->  sudo cat /etc/conesa.admin-pass"
fi

if vacia ADMIN_COOKIE_SECRET; then
  fijar ADMIN_COOKIE_SECRET "$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 44)"
  echo "  secreto de sesion generado"
fi

if [ -n "$GA" ]; then
  fijar NEXT_PUBLIC_GA_ID "$GA"
  echo "  Analytics: $GA"
fi

if [ -n "$BUCKET" ]; then
  fijar BUCKET "$BUCKET"
  echo "  respaldos nocturnos a: gs://$BUCKET"
fi

echo
echo "Todavia sin cargar (van a mano, son de terceros):"
grep -oE '^(MP_ACCESS_TOKEN|RESEND_API_KEY|GEMINI_API_KEY)=$' "$ENV" | tr -d '=' | sed 's/^/  - /' || echo "  ninguna"
