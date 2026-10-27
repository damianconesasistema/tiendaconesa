#!/usr/bin/env bash
# Sube los cambios a la VM: respalda, baja el codigo nuevo, compila, aplica
# las migraciones de la base y reinicia la tienda.
#
#   sudo /opt/conesa/deploy/actualizar.sh
#
# Es lo unico que hay que correr cada vez que haya cambios.

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

cd /opt/conesa
set -a
. /etc/conesa.env
set +a

echo "==> Respaldo antes de tocar nada"
/usr/local/bin/conesa-backup || echo "    (sin respaldo: la base todavia esta vacia)"

echo "==> Codigo nuevo"
# Bash lee el script a medida que lo ejecuta, no entero de una. Si el git
# pull cambia este mismo archivo, lo que corre despues sale del archivo nuevo
# pero leido desde la posicion vieja: ejecuta lineas partidas o se saltea
# otras, y el error que aparece no tiene nada que ver con la causa. Nos paso
# el 27/10: la linea de npm ci quedo en la version vieja y la compilacion
# fallo por dependencias que el script nuevo si instalaba.
#
# Por eso: si el archivo cambio, se arranca de nuevo con la version nueva.
# No se cicla, porque en la segunda vuelta el pull ya no cambia nada.
ANTES=$(sha1sum "$0")
git pull --ff-only
if [ "$ANTES" != "$(sha1sum "$0")" ]; then
  echo "    el script cambio: se reinicia con la version nueva"
  exec bash "$0" "$@"
fi

echo "==> Dependencias"
# --include=dev a proposito. /etc/conesa.env trae NODE_ENV=production, y con
# eso npm se saltea las dependencias de desarrollo. Pero compilar Next.js
# necesita Tailwind y TypeScript, que son justamente de desarrollo: sin
# ellas la compilacion falla con "module not found" y cuesta entender por que,
# porque el codigo esta bien y el error apunta a un archivo cualquiera.
npm ci --include=dev --no-audit --fund=false

echo "==> Compilando (tarda varios minutos en esta maquina)"
# La compilacion es lo que mas memoria come. Se le pone un techo para que no
# se lleve puesta la base de datos.
NODE_OPTIONS="--max-old-space-size=1536" npm run build

echo "==> Reiniciando"
# npm start corre las migraciones (prisma/pre-start.mjs) y despues levanta Next.
systemctl restart conesa
sleep 5
systemctl --no-pager --lines=10 status conesa || true

echo
echo "Listo. Si algo salio mal, el detalle esta en:  journalctl -u conesa -n 50"
