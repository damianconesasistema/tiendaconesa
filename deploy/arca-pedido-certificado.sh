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
#   sudo bash arca-pedido-certificado.sh [alias]
#
# El alias es el nombre con el que el certificado figura en ARCA. Por defecto
# "tienda-conesa". Tiene que ser uno NUEVO: no reutilizar el de otro sistema,
# porque dar de alta un alias que ya existe pisa el certificado del otro.

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

ALIAS="${1:-tienda-conesa}"
CLAVE=/etc/conesa.arca.key
PEDIDO=/etc/conesa.arca.csr

# Los datos del emisor salen del mismo archivo de claves que usa la tienda,
# asi no hay dos lugares donde pueden quedar distintos.
set -a; . /etc/conesa.env; set +a

CUIT=$(printf '%s' "${AFIP_CUIT:-}" | tr -cd '0-9')
RAZON=${NEXT_PUBLIC_RAZON_SOCIAL:-}

[ ${#CUIT} -eq 11 ] || { echo "AFIP_CUIT tiene que tener 11 digitos; hay '$CUIT'"; exit 1; }
[ -n "$RAZON" ] || { echo "Falta NEXT_PUBLIC_RAZON_SOCIAL en /etc/conesa.env"; exit 1; }

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
Que hacer con esto, con la clave fiscal de Carlos:

  1) Punto de venta. Comprobantes en linea -> ABM puntos de
     venta -> alta del punto $(printf '%s' "${AFIP_PTO_VTA:-6}") como
     "RECE para aplicativo y web services".
     NO tocar el punto de venta 3, que es de GBP.

  2) Certificado. Segun donde se va a facturar:
       - para probar:  servicio WSASS  (homologacion)
       - de verdad:    "Administracion de Certificados Digitales"
     Crear un alias NUEVO llamado "$ALIAS" y pegar el pedido
     de arriba. NO tocar el alias de GBP.
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
