#!/usr/bin/env bash
# Respaldo de la base. Corre solo todas las noches a las 3 (cron) y tambien
# antes de cada actualizacion.
#
# Guarda 14 dias en el disco de la VM y, si hay un deposito de Google Cloud
# configurado (BUCKET en /etc/conesa.env), sube una copia ahi. Las dos cosas
# importan: la copia en el disco no sirve de nada si se pierde la VM.

set -euo pipefail

DESTINO=/var/backups/conesa
DIAS=14
mkdir -p "$DESTINO"

if [ -f /etc/conesa.env ]; then
  set -a
  . /etc/conesa.env
  set +a
fi

SELLO=$(date +%Y-%m-%d_%H%M)
ARCHIVO="$DESTINO/conesa-$SELLO.sql.gz"

su postgres -c "pg_dump conesa" | gzip > "$ARCHIVO"
echo "$(date '+%F %T')  $ARCHIVO  $(du -h "$ARCHIVO" | cut -f1)"

# Copia afuera de la maquina. Sin esto, si se pierde la VM se pierde todo.
if [ -n "${BUCKET:-}" ] && command -v gsutil >/dev/null; then
  gsutil -q cp "$ARCHIVO" "gs://$BUCKET/" && echo "  subido a gs://$BUCKET/"
fi

# Se borran los viejos para que el disco de 30 GB no se llene.
find "$DESTINO" -name 'conesa-*.sql.gz' -mtime +$DIAS -delete
