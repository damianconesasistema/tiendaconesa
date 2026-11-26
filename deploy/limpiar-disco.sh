#!/usr/bin/env bash
# Lugar en el disco del servidor. Lo corre la publicacion (Publicar, en
# GitHub) antes de compilar, con: ssh ... 'sudo bash -s' < deploy/limpiar-disco.sh
#
# 26/11/2026: el disco de 30 GB llego al 100 % y se freno la publicacion (y
# Punto cargaba a medias). Lo habian llenado 17 GB de copias de la base en
# /var/backups/conesa: backup.sh hace una antes de CADA publicacion y las
# guardaba 14 dias (con muchas publicaciones por dia, cientos). Todas se
# suben tambien al deposito de Google (gs://$BUCKET). Damian: "si borralas"
# y agrando el disco a 50 GB.
#
# Que hace, sin parar nada:
# 1. Si el disco se agrando en Google, que el sistema use el lugar nuevo
#    (crece la particion y el sistema de archivos con la maquina andando).
# 2. Borra del disco las copias de la base que YA ESTAN en el deposito de
#    Google con el mismo nombre y el mismo tamano. Quedan siempre las 3 mas
#    nuevas y las de la noche (las de las 3:00) de los ultimos 14 dias. Si no
#    se puede leer el deposito, no se borra ninguna.
# 3. La cache de npm de root (en el servidor no se instala nada: las
#    dependencias llegan armadas desde GitHub).
#
# Nunca hace fallar la publicacion.

set -uo pipefail

decir() { echo "    $*"; }
libre() { df -Pm / | awk 'NR==2 {print $4}'; }

decir "disco antes: $(df -h / | awk 'NR==2 {print $3" usados de "$2" ("$5")"}')"

# 1. El lugar nuevo, si lo hay.
if command -v growpart >/dev/null 2>&1; then
  if growpart /dev/sda 1 >/dev/null 2>&1; then decir "la particion crecio al tamano nuevo del disco"; fi
fi
resize2fs /dev/sda1 >/dev/null 2>&1 || true

# 2. Las copias que ya estan en Google.
DESTINO=/var/backups/conesa
if [ -f /etc/conesa.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /etc/conesa.env
  set +a
fi
if [ -d "$DESTINO" ] && [ -n "${BUCKET:-}" ] && command -v gcloud >/dev/null 2>&1; then
  LISTA=$(mktemp)
  if gcloud storage ls -l "gs://$BUCKET/" >"$LISTA" 2>/dev/null && [ -s "$LISTA" ]; then
    antes=$(ls -1 "$DESTINO"/conesa-*.sql.gz 2>/dev/null | wc -l)
    ls -1t "$DESTINO"/conesa-*.sql.gz 2>/dev/null | tail -n +4 | while IFS= read -r f; do
      n=$(basename "$f")
      # Las de la noche de los ultimos 14 dias quedan.
      case "$n" in
        *_0300.sql.gz) [ -n "$(find "$f" -mtime -14 2>/dev/null)" ] && continue ;;
      esac
      t=$(stat -c %s "$f")
      # "  TAMANO  FECHA  gs://deposito/nombre": mismo nombre y mismo tamano.
      if awk -v n="/$n" -v t="$t" '$1 == t && substr($NF, length($NF) - length(n) + 1) == n { ok = 1 } END { exit !ok }' "$LISTA"; then
        rm -f -- "$f"
      fi
    done
    despues=$(ls -1 "$DESTINO"/conesa-*.sql.gz 2>/dev/null | wc -l)
    decir "copias de la base en el disco: $antes -> $despues (las borradas ya estaban en gs://$BUCKET)"
  else
    decir "no pude leer el deposito de Google: no borro ninguna copia"
  fi
  rm -f "$LISTA"
else
  decir "sin deposito configurado o sin gcloud: no borro ninguna copia"
fi

# 3. La cache de npm.
if [ -d /root/.npm/_cacache ]; then
  rm -rf /root/.npm/_cacache && decir "cache de npm vaciada"
fi

decir "disco despues: $(df -h / | awk 'NR==2 {print $3" usados de "$2" ("$5"), libres "$4}')"
exit 0
