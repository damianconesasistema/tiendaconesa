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

# 1. El lugar nuevo, si lo hay. Primero que el sistema vuelva a mirar el
#    tamano del disco (si se agrando en Google con la maquina prendida).
echo 1 > /sys/class/block/sda/device/rescan 2>/dev/null || true
decir "disco segun Google: $(lsblk -dn -o SIZE /dev/sda 2>/dev/null | tr -d ' ') · particion: $(lsblk -n -o SIZE /dev/sda1 2>/dev/null | tr -d ' ')"
if command -v growpart >/dev/null 2>&1; then
  if growpart /dev/sda 1 >/dev/null 2>&1; then decir "la particion crecio al tamano nuevo del disco"; fi
else
  decir "no esta growpart (cloud-guest-utils): la particion no se puede agrandar con la maquina andando"
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

# 4. La base. 26/11/2026: con el disco lleno Postgres se detuvo (asi no
#    rompe datos) y al liberar lugar NO volvio sola: la tienda daba 500. Si
#    no esta atendiendo, se levanta y se comprueba.
if command -v pg_isready >/dev/null 2>&1 && ! pg_isready -q 2>/dev/null; then
  decir "LA BASE NO ESTABA ANDANDO: la levanto"
  systemctl start postgresql >/dev/null 2>&1 || true
  for u in $(systemctl list-units --all --plain --no-legend 'postgresql@*' 2>/dev/null | awk '{print $1}'); do
    systemctl start "$u" >/dev/null 2>&1 || true
  done
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12; do pg_isready -q 2>/dev/null && break; sleep 5; done
  if pg_isready -q 2>/dev/null; then
    decir "la base volvio a andar"
  else
    decir "LA BASE SIGUE SIN ANDAR. Lo que dice:"
    journalctl -u 'postgresql*' -n 25 --no-pager -o cat 2>/dev/null | sed 's/^/      /' | tail -25
  fi
else
  decir "la base esta andando"
fi
exit 0
