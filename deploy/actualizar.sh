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
git pull --ff-only

echo "==> Dependencias"
npm ci --no-audit --fund=false

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
