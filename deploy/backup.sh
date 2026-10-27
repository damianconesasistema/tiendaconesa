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
#
# Si hay deposito configurado pero no hay con que subir, avisa fuerte en vez
# de saltear el paso callado: un respaldo que vive solo en el disco de la
# maquina que respalda no es un respaldo, y lo peor seria enterarse el dia
# que haga falta.
if [ -n "${BUCKET:-}" ]; then
  if command -v gcloud >/dev/null; then
    SUBIR=(gcloud storage cp "$ARCHIVO" "gs://$BUCKET/")
  elif command -v gsutil >/dev/null; then
    SUBIR=(gsutil -q cp "$ARCHIVO" "gs://$BUCKET/")
  else
    SUBIR=()
    echo "  AVISO: hay BUCKET configurado pero no hay gcloud ni gsutil."
    echo "         La copia quedo SOLO en el disco de la VM."
  fi
  if [ ${#SUBIR[@]} -gt 0 ]; then
    if "${SUBIR[@]}" >/dev/null 2>&1; then
      echo "  subido a gs://$BUCKET/"
    else
      echo "  AVISO: fallo la subida a gs://$BUCKET/"
    fi
  fi
fi

# Se borran los viejos para que el disco de 30 GB no se llene.
find "$DESTINO" -name 'conesa-*.sql.gz' -mtime +$DIAS -delete
