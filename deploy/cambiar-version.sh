#!/usr/bin/env bash
# Pone la version nueva de la tienda SIN CORTE. Corre en el servidor, como
# root, desde /opt/conesa, despues de traer el codigo (git reset). Lo llaman
# la publicacion automatica (.github/workflows/publicar.yml), deploy/publicar.sh
# y deploy/actualizar.sh. Espera la compilacion en /tmp/next.tgz y, si
# cambiaron las dependencias, node_modules en /tmp/mods.tgz.
#
# Damian, 18/11/2026, con la pantalla de 502 de Cloudflare: "porque tira eso
# cada vez que subis". Antes se reiniciaba el unico programa de la tienda y,
# mientras arrancaba (unos nueve segundos en esta maquina), nadie atendia.
#
# COMO FUNCIONA
# Hay dos lugares para la tienda: el puerto 3000 y el 3001. Uno atiende; el
# otro esta apagado. Al publicar:
#   1. La compilacion nueva va al lugar apagado (.next-3000 o .next-3001).
#   2. Se prende ese lugar y se espera a que conteste.
#   3. nginx pasa las visitas nuevas al lugar nuevo (reload: sin cortar las
#      que estan en curso).
#   4. Unos segundos despues se apaga el viejo.
# Si el nuevo no contesta, se apaga el nuevo y el viejo sigue como si nada.
#
# Cada lugar es una copia del servicio conesa@.service (conesa@3000,
# conesa@3001). Las dos usan el mismo /opt/conesa (codigo, node_modules) y
# cada una ve SU compilacion en /opt/conesa/.next (BindPaths): la compilacion
# de Next guarda ese camino adentro y no se puede mover a otra carpeta.
#
# MEMORIA. La maquina tiene 1 GB. Por unos segundos hay dos tiendas prendidas,
# asi que antes se mira cuanta memoria queda. Si no alcanza, o si cambiaron las
# dependencias (que se pisan en node_modules, compartido), se hace como antes:
# se apaga el viejo y despues se prende el nuevo (corta unos segundos).
#
# LA PRIMERA VEZ esto pasa de la forma vieja (un solo servicio, "conesa", en el
# 3000) a la nueva: instala conesa@.service, crea el upstream de nginx
# (/etc/nginx/conf.d/conesa-app.conf) y cambia en los sitios de nginx
# "proxy_pass http://127.0.0.1:3000" por "proxy_pass http://conesa_app". Antes
# guarda una copia de /etc/nginx. Si nginx no acepta el cambio, vuelve todo
# atras y publica de la forma vieja.
#
# Otros usos:
#   bash deploy/cambiar-version.sh --puerto    el puerto que atiende ahora
#   bash deploy/cambiar-version.sh --servicio  el servicio que atiende ahora
#                                              (para reiniciarlo a mano)

set -uo pipefail

# Los caminos se pueden cambiar solo para probar este script en otra maquina.
DIR="${CONESA_DIR:-/opt/conesa}"
UPSTREAM="${CONESA_UPSTREAM:-/etc/nginx/conf.d/conesa-app.conf}"
SITIOS="${CONESA_SITIOS:-/etc/nginx/sites-enabled}"
UNIDAD="${CONESA_UNIDAD:-/etc/systemd/system/conesa@.service}"
ENVF="${CONESA_ENV:-/etc/conesa.env}"
TMP="${CONESA_TMP:-/tmp}"
MEMINFO="${CONESA_MEMINFO:-/proc/meminfo}"
RESPALDO_NGINX="${CONESA_RESPALDO_NGINX:-/root/nginx-antes-de-conesa-app.tgz}"
NGINX_ETC="${CONESA_NGINX_ETC:-/etc/nginx}"
# Cuanta memoria libre (MB, contando la de intercambio) hace falta para tener
# las dos tiendas prendidas a la vez.
MINIMO_MB="${CONESA_MINIMO_MB:-600}"
ESPERA="${CONESA_ESPERA:-150}"
DRENAR="${CONESA_DRENAR:-8}"

puerto_activo() {
  if [ -f "$UPSTREAM" ]; then
    grep -oE '127\.0\.0\.1:[0-9]+' "$UPSTREAM" | head -1 | cut -d: -f2
  else
    echo 3000
  fi
}
servicio_activo() {
  if [ -f "$UPSTREAM" ]; then echo "conesa@$(puerto_activo)"; else echo conesa; fi
}

case "${1:-}" in
  --puerto) puerto_activo; exit 0 ;;
  --servicio) servicio_activo; exit 0 ;;
esac

decir() { echo "    $*"; }
contesta() { [ "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "http://127.0.0.1:$1/" 2>/dev/null)" = "200" ]; }
esperar() {
  local i
  for i in $(seq 1 $(($2 / 2))); do
    contesta "$1" && return 0
    sleep 2
  done
  return 1
}
upstream_a() {
  printf '%s\n' \
    "# Lo escribe deploy/cambiar-version.sh: a que puerto le pasa nginx las" \
    "# visitas de la tienda. No tocar a mano." \
    "upstream conesa_app {" \
    "    server 127.0.0.1:$1;" \
    "}" >"$UPSTREAM.nuevo" && mv "$UPSTREAM.nuevo" "$UPSTREAM"
}

cd "$DIR" || exit 1
[ -f "$TMP/next.tgz" ] || { decir "No esta la compilacion nueva ($TMP/next.tgz)."; exit 1; }

ACTIVO=$(puerto_activo)
VIEJO=$(servicio_activo)
if [ "$ACTIVO" = "3000" ]; then NUEVO=3001; else NUEVO=3000; fi
decir "Atiende $VIEJO (puerto $ACTIVO); la version nueva va al $NUEVO."

# ---------------------------------------------------------------- archivos
DEPS=0
if [ -f "$TMP/mods.tgz" ]; then
  DEPS=1
  decir "Cambiaron las dependencias: van a node_modules."
  rm -rf node_modules && tar xzf "$TMP/mods.tgz" && rm -f "$TMP/mods.tgz"
fi

# El lugar nuevo tiene que estar apagado (si quedo prendido de algun intento).
# Y si ya se paso a los dos lugares, el servicio viejo de un solo lugar
# tambien: si alguien lo prendiera, se quedaria con el puerto 3000.
systemctl stop "conesa@$NUEVO" 2>/dev/null || true
if [ "$VIEJO" != "conesa" ]; then
  systemctl stop conesa 2>/dev/null || true
  systemctl disable -q conesa 2>/dev/null || true
fi
rm -rf ".next-$NUEVO" && mkdir ".next-$NUEVO"
tar xzf "$TMP/next.tgz" -C ".next-$NUEVO" --strip-components=1 && rm -f "$TMP/next.tgz"
[ -f ".next-$NUEVO/BUILD_ID" ] || { decir "La compilacion nueva vino incompleta: no se toca nada."; exit 1; }
# Donde cada copia ve su compilacion (BindPaths) tiene que existir.
mkdir -p .next

# Regenerar SIEMPRE el cliente de Prisma: si el esquema sumo una columna y el
# cliente quedo viejo, la consulta falla sin decir nada.
npx prisma generate >/dev/null
# La base, ANTES de cambiar nada, con la tienda vieja atendiendo. Si falla,
# queda la vieja.
set -a
# shellcheck disable=SC1090
. "$ENVF"
set +a
node prisma/pre-start.mjs || { decir "Fallo la preparacion de la base: queda andando la version de antes."; exit 1; }

# -------------------------------------------------- la forma vieja (reserva)
a_la_antigua() {
  decir "Se publica de la forma vieja (un solo servicio, corta unos segundos)."
  rm -rf .next-vieja
  if ! { mv .next .next-vieja && mv ".next-$NUEVO" .next; }; then
    mv .next-vieja .next 2>/dev/null
    decir "No se pudo poner la compilacion nueva: queda la de antes."
    exit 1
  fi
  systemctl restart conesa
  rm -rf .next-vieja
  esperar 3000 "$ESPERA" || { decir "La tienda no contesto."; exit 1; }
  decir "Lista (forma vieja)."
  exit 0
}

# ------------------------------------------- la primera vez: servicio y nginx
if ! cmp -s deploy/conesa@.service "$UNIDAD"; then
  cp deploy/conesa@.service "$UNIDAD"
  systemctl daemon-reload
  decir "Servicio conesa@.service instalado."
fi

if [ ! -f "$UPSTREAM" ]; then
  decir "Primera vez: nginx pasa a usar el upstream conesa_app."
  [ -f "$RESPALDO_NGINX" ] || tar czf "$RESPALDO_NGINX" -C "$(dirname "$NGINX_ETC")" "$(basename "$NGINX_ETC")"
  upstream_a 3000
  for f in "$SITIOS"/*; do
    [ -e "$f" ] || continue
    sed -i --follow-symlinks -E 's#proxy_pass http://(127\.0\.0\.1|localhost):3000(/?);#proxy_pass http://conesa_app\2;#g' "$f"
  done
  if grep -RqsE 'proxy_pass[[:space:]]+https?://(127\.0\.0\.1|localhost):3000' "$SITIOS"/ "$NGINX_ETC/conf.d"/ ||
    ! nginx -t >/dev/null 2>&1; then
    decir "nginx no acepto el cambio (o quedo algo apuntando al 3000): se vuelve atras."
    rm -f "$UPSTREAM"
    tar xzf "$RESPALDO_NGINX" -C "$(dirname "$NGINX_ETC")"
    nginx -t >/dev/null 2>&1 && systemctl reload nginx
    a_la_antigua
  fi
  systemctl reload nginx
fi

# ------------------------------------------------- intercambio, por las dudas
# Sin memoria de intercambio, dos tiendas a la vez en 1 GB pueden hacer que
# el sistema mate algo (hasta la base). Un archivo de 1 GB la evita; solo si
# sobra disco. vm.swappiness bajo: que se use solo si hace falta.
if [ -z "$(swapon --show --noheadings 2>/dev/null)" ] && [ ! -f /swapfile ]; then
  LIBRE_DISCO=$(df -Pm / | awk 'NR==2 {print $4}')
  if [ "${LIBRE_DISCO:-0}" -ge 4096 ]; then
    if fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile; then
      grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
      echo 'vm.swappiness=10' >/etc/sysctl.d/99-conesa.conf
      sysctl -q -p /etc/sysctl.d/99-conesa.conf || true
      decir "Memoria de intercambio de 1 GB creada."
    else
      rm -f /swapfile
    fi
  fi
fi

# ------------------------------------------------------------- el cambio
LIBRE_MB=$(awk '/^MemAvailable:/ {m=$2} /^SwapFree:/ {s=$2} END {print int((m+s)/1024)}' "$MEMINFO")
decir "Memoria libre (con intercambio): ${LIBRE_MB} MB."
SECUENCIAL=0
if [ "${CONESA_SECUENCIAL:-0}" = "1" ]; then
  SECUENCIAL=1
  decir "Se pidio apagar la vieja primero."
elif [ "$DEPS" = "1" ]; then
  SECUENCIAL=1
  decir "Como cambiaron las dependencias, primero se apaga la vieja."
elif [ "${LIBRE_MB:-0}" -lt "$MINIMO_MB" ]; then
  SECUENCIAL=1
  decir "No alcanza la memoria para las dos a la vez: primero se apaga la vieja."
fi

[ "$SECUENCIAL" = "1" ] && systemctl stop "$VIEJO"

# Si algo ya contesta en el puerto nuevo, no es la version nueva: se frena
# (si no, se tomaria esa respuesta como que la nueva arranco).
if contesta "$NUEVO"; then
  decir "Algo ya atiende en el puerto $NUEVO y no es la version nueva: no se cambia nada."
  [ "$SECUENCIAL" = "1" ] && systemctl start "$VIEJO"
  exit 1
fi
systemctl start "conesa@$NUEVO"
if ! esperar "$NUEVO" "$ESPERA"; then
  decir "La version nueva no contesto en $ESPERA segundos: queda la de antes."
  systemctl stop "conesa@$NUEVO"
  [ "$SECUENCIAL" = "1" ] && systemctl start "$VIEJO"
  exit 1
fi
# Un par de pantallas para que cargue lo suyo antes de recibir clientes.
for p in /tienda /admin/login; do curl -s -o /dev/null -m 20 "http://127.0.0.1:$NUEVO$p" || true; done

upstream_a "$NUEVO"
if ! { nginx -t >/dev/null 2>&1 && systemctl reload nginx; }; then
  decir "nginx no acepto el cambio de puerto: queda la de antes."
  upstream_a "$ACTIVO"
  systemctl stop "conesa@$NUEVO"
  [ "$SECUENCIAL" = "1" ] && systemctl start "$VIEJO"
  exit 1
fi
decir "nginx ya le pasa las visitas al $NUEVO."

# Que arranque la que corresponde si se reinicia la maquina.
systemctl enable -q "conesa@$NUEVO"
if [ "$VIEJO" = "conesa" ]; then systemctl disable -q conesa 2>/dev/null || true; else systemctl disable -q "$VIEJO" 2>/dev/null || true; fi

# Las visitas que estaban en curso con la vieja terminan; despues se apaga.
if [ "$SECUENCIAL" = "0" ]; then
  sleep "$DRENAR"
  systemctl stop "$VIEJO"
fi
decir "Lista: atiende conesa@$NUEVO."
exit 0
