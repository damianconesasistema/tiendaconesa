#!/usr/bin/env bash
# Carga en la tienda el certificado que devolvio ARCA.
#
#   sudo bash arca-cargar-certificado.sh /ruta/al/certificado.crt [sucursal]
#
# La sucursal es el slug del local (bsas, traslasierra). Con sucursal, el
# certificado se guarda aparte y las variables salen con el sufijo del local
# (AFIP_CERT_BSAS, AFIP_KEY_BSAS): son dos contribuyentes distintos y cada
# tienda factura con el suyo. Sin sucursal, como siempre: el de la tienda
# que ya esta facturando.
#
# Antes de guardar nada comprueba que el certificado sea realmente el par de
# la clave privada que tenemos. Es el error mas comun y el mas confuso: si no
# coinciden, ARCA rechaza el login con un mensaje que no explica nada, y uno
# termina buscando el problema en cualquier otro lado.

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

CRT="${1:-}"
SUCURSAL="${2:-}"
ENV=/etc/conesa.env

if [ -n "$SUCURSAL" ]; then
  CLAVE=/etc/conesa.arca.$SUCURSAL.key
  DESTINO=/etc/conesa.arca.$SUCURSAL.crt
  # El sufijo va en mayusculas: AFIP_CERT_BSAS, AFIP_KEY_BSAS.
  SUFIJO=_$(printf '%s' "$SUCURSAL" | tr '[:lower:]-' '[:upper:]_')
else
  CLAVE=/etc/conesa.arca.key
  DESTINO=/etc/conesa.arca.crt
  SUFIJO=""
fi

[ -n "$CRT" ] || { echo "Falta el archivo .crt. Uso: sudo bash $0 certificado.crt"; exit 1; }
[ -f "$CRT" ] || { echo "No existe: $CRT"; exit 1; }
[ -f "$CLAVE" ] || { echo "No esta la clave privada ($CLAVE). Corre primero arca-pedido-certificado.sh"; exit 1; }

grep -q 'BEGIN CERTIFICATE' "$CRT" || {
  echo "Eso no parece un certificado. Tiene que empezar con -----BEGIN CERTIFICATE-----"
  exit 1
}

# El certificado y la clave son par solo si la parte publica coincide.
HC=$(openssl x509 -in "$CRT" -noout -modulus | openssl md5)
HK=$(openssl rsa -in "$CLAVE" -noout -modulus 2>/dev/null | openssl md5)
if [ "$HC" != "$HK" ]; then
  echo "El certificado NO corresponde a la clave privada de este servidor."
  echo "Suele pasar cuando se sube a ARCA un pedido viejo, o cuando se"
  echo "genero la clave de nuevo despues de pedir el certificado."
  echo "Volve a correr arca-pedido-certificado.sh y subi ESE pedido."
  exit 1
fi

VENCE=$(openssl x509 -in "$CRT" -noout -enddate | cut -d= -f2)
SUJETO=$(openssl x509 -in "$CRT" -noout -subject | sed 's/^subject= *//')

install -m 600 "$CRT" "$DESTINO"

fijar() {
  local clave=$1 valor=$2
  if grep -q "^$clave=" "$ENV"; then
    sed -i "s|^$clave=.*|$clave=$valor|" "$ENV"
  else
    printf '%s=%s\n' "$clave" "$valor" >> "$ENV"
  fi
}

fijar "AFIP_CERT$SUFIJO" "$(base64 -w0 "$DESTINO")"
fijar "AFIP_KEY$SUFIJO"  "$(base64 -w0 "$CLAVE")"

cat <<FIN

Certificado cargado.
  sujeto:    $SUJETO
  vence:     $VENCE
  archivo:   $DESTINO
  variables: AFIP_CERT$SUFIJO y AFIP_KEY$SUFIJO
  ambiente actual: ${AFIP_ENV:-homologacion}

Para que la tienda lo tome:
  sudo /opt/conesa/deploy/actualizar.sh

En homologacion los comprobantes NO tienen validez fiscal: sirven para
probar y nada mas. Recien cuando una prueba salga bien conviene pasar
AFIP_ENV a produccion, con el certificado de produccion (es otro).
FIN
