#!/usr/bin/env bash
# Arma el pedido de certificado (CSR) para la facturacion electronica de ARCA.
#
# Son dos archivos: una clave privada, que se queda para siempre en este
# servidor y no sale nunca, y un pedido (CSR) que SI se sube a ARCA. ARCA
# devuelve un certificado .crt, que es publico y no tiene ningun secreto.
#
# OJO: si se pierde la clave privada, el certificado que devuelva ARCA no
# sirve para nada y hay que empezar de nuevo. Por eso queda en /etc con
# permiso solo para root, igual que las demas claves.
#
#   sudo bash arca-pedido-certificado.sh [alias] [sucursal]
#
# El alias es el nombre con el que el certificado figura en ARCA. Tiene que
# ser uno NUEVO: dar de alta un alias que ya existe PISA el certificado del
# otro sistema y ese sistema deja de facturar en ese mismo momento, sin
# aviso. En el CUIT de la S.R.L. ya hay dos, GBP y conesaa1: ninguno se toca.
#
# La sucursal es el slug o el subdominio del local (traslasierra, bsas,
# buenosaires). Con eso el CUIT y la razon social salen de la base, que es
# donde estan cargados y verificados, en vez de escribirlos a mano: un CUIT
# mal tipeado se descubre recien cuando ARCA rechaza la primera factura.
#
# Cada sucursal tiene SU clave y SU pedido, en archivos aparte. Son dos
# contribuyentes distintos: compartir la clave seria facturar uno con el
# certificado del otro.

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

ALIAS="${1:-tienda-conesa}"
SUCURSAL="${2:-}"

set -a; . /etc/conesa.env; set +a

if [ -n "$SUCURSAL" ]; then
  # De la base: es donde estan los datos de cada local y los edita el panel.
  LEER="SELECT cuit, \"razonSocial\" FROM \"Branch\""
  LEER="$LEER WHERE slug = '$SUCURSAL' OR subdominio = '$SUCURSAL' LIMIT 1"
  FILA=$(sudo -u postgres psql -d conesa -tA -F'|' -c "$LEER" || true)
  [ -n "$FILA" ] || { echo "No hay ninguna sucursal '$SUCURSAL'"; exit 1; }
  CUIT=$(printf '%s' "${FILA%%|*}" | tr -cd '0-9')
  RAZON=${FILA#*|}
  # Cada sucursal con sus archivos propios.
  CLAVE=/etc/conesa.arca.$SUCURSAL.key
  PEDIDO=/etc/conesa.arca.$SUCURSAL.csr
else
  # Sin sucursal: la de siempre, la que factura hoy. Los datos salen del
  # mismo archivo de claves que usa la tienda.
  CUIT=$(printf '%s' "${AFIP_CUIT:-}" | tr -cd '0-9')
  RAZON=${NEXT_PUBLIC_RAZON_SOCIAL:-}
  CLAVE=/etc/conesa.arca.key
  PEDIDO=/etc/conesa.arca.csr
fi

[ ${#CUIT} -eq 11 ] || { echo "El CUIT tiene que tener 11 digitos; hay '$CUIT'"; exit 1; }
[ -n "$RAZON" ] || { echo "Falta la razon social"; exit 1; }

echo "Se va a pedir un certificado para:"
echo "  razon social: $RAZON"
echo "  CUIT:         $CUIT"
echo "  alias:        $ALIAS"
echo "  clave:        $CLAVE"
echo

if [ -f "$CLAVE" ]; then
  echo "Ya existe $CLAVE: se reusa (no se pisa, porque perderla invalida"
  echo "cualquier certificado que ARCA haya emitido contra ella)."
else
  openssl genrsa -out "$CLAVE" 2048 2>/dev/null
  chmod 600 "$CLAVE"
  echo "Clave privada nueva en $CLAVE"
fi

openssl req -new -key "$CLAVE" -out "$PEDIDO" \
  -subj "/C=AR/O=$RAZON/CN=$ALIAS/serialNumber=CUIT $CUIT"
chmod 644 "$PEDIDO"

cat <<FIN

===========================================================
Pedido listo. Esto es lo que hay que subir a ARCA; se puede
copiar tal cual, no tiene nada secreto adentro:

FIN
cat "$PEDIDO"
cat <<FIN

===========================================================
Que hacer con esto, con la clave fiscal del titular de esta
sucursal:

  1) Punto de venta. "Administracion de puntos de venta y
     domicilios" -> alta de un punto NUEVO, del tipo
     "RECE para aplicativo y web services".
     NO tocar el de GBP ni ningun otro que ya este en uso.

  2) Certificado. Segun donde se va a facturar:
       - para probar:  servicio WSASS  (homologacion)
       - de verdad:    "Administracion de Certificados Digitales"
     Crear un alias NUEVO llamado "$ALIAS" y pegar el pedido
     de arriba. NO tocar los alias que ya existen.
     Bajar el .crt que devuelve.

  3) Permiso. "Administrador de Relaciones de Clave Fiscal"
     -> Nueva Relacion -> servicio "Facturacion Electronica"
     (wsfe) -> representante: el certificado recien creado.

  4) Traer el .crt de vuelta aca:
       sudo bash /opt/conesa/deploy/arca-cargar-certificado.sh archivo.crt

Son certificados distintos para homologacion y para
produccion: el de prueba no sirve para facturar en serio.
===========================================================
FIN
