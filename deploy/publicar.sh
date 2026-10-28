#!/usr/bin/env bash
# Publica los cambios compilando en Cloud Shell y mandando al servidor solo
# el resultado ya hecho.
#
#   bash publicar.sh
#
# Por que: la e2-micro del nivel gratuito tiene un cuarto de procesador y no
# llega a compilar Next.js. La alternativa era agrandarla cada vez
# (actualizar-remoto.sh), pero eso apaga la tienda unos ocho minutos. Cloud
# Shell es gratis y tiene procesador de verdad: compila aca y al servidor le
# llega el resultado, asi que lo unico que se corta es el reinicio del
# programa, cinco segundos.
#
# Se compila en /opt/conesa, el MISMO camino que en el servidor, a proposito:
# la compilacion guarda rutas absolutas adentro, y si los caminos no fueran
# iguales el resultado apuntaria a carpetas que del otro lado no existen.
#
# Lo que viaja: la carpeta .next siempre, y node_modules solo cuando cambiaron
# las dependencias. Instalarlas en la maquina chica, con la tienda andando al
# lado, es justo lo que la deja sin memoria.

set -euo pipefail

VM=${VM:-conesa}
ZONA=${ZONA:-us-central1-a}
REPO=${REPO:-https://github.com/damianconesasistema/tiendaconesa.git}
DIR=/opt/conesa

en_la_vm() { gcloud compute ssh "$VM" --zone "$ZONA" --quiet --command "$1"; }

echo "==> 1/5 Codigo"
if [ ! -d "$DIR" ]; then
  sudo mkdir -p "$DIR"
  sudo chown "$(id -u):$(id -g)" "$DIR"
fi
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch -q origin
  git -C "$DIR" reset -q --hard origin/main
else
  git clone -q "$REPO" "$DIR"
fi
cd "$DIR"
echo "    $(git log --oneline -1)"

echo "==> 2/5 Variables publicas"
# Las NEXT_PUBLIC_ se graban DENTRO de la pagina al compilar, asi que tienen
# que ser las mismas que usa el servidor o la tienda sale con los datos de
# otro lado (Analytics, pixel, CUIT). No son secretas: se ven en la pagina.
en_la_vm 'sudo grep -E "^(NEXT_PUBLIC_|NODE_ENV=)" /etc/conesa.env' > /tmp/publicas.env
set -a; . /tmp/publicas.env; set +a
rm -f /tmp/publicas.env
echo "    $(grep -c . <<<"$(env | grep ^NEXT_PUBLIC_)") variables tomadas del servidor"

echo "==> 3/5 Dependencias"
npm ci --include=dev --no-audit --fund=false >/dev/null
echo "    listas"

echo "==> 4/5 Compilando"
npm run build

echo "==> 5/5 Al servidor"
# Respaldo antes de pisar nada, igual que hace actualizar.sh.
en_la_vm 'sudo /usr/local/bin/conesa-backup' || echo "    (el respaldo fallo, seguimos)"

LOCAL=$(sha1sum package-lock.json | cut -c1-40)
REMOTO=$(en_la_vm "sha1sum $DIR/package-lock.json 2>/dev/null | cut -c1-40" | tr -d '\r\n ')

tar czf /tmp/next.tgz .next
if [ "$LOCAL" != "$REMOTO" ]; then
  echo "    cambiaron las dependencias: tambien viajan"
  tar czf /tmp/mods.tgz node_modules
  gcloud compute scp /tmp/mods.tgz "$VM":/tmp/ --zone "$ZONA" --quiet
fi
gcloud compute scp /tmp/next.tgz "$VM":/tmp/ --zone "$ZONA" --quiet

en_la_vm "sudo bash -c '
  cd $DIR
  git fetch -q origin && git reset -q --hard origin/main
  if [ -f /tmp/mods.tgz ]; then rm -rf node_modules && tar xzf /tmp/mods.tgz && rm -f /tmp/mods.tgz; fi
  rm -rf .next && tar xzf /tmp/next.tgz && rm -f /tmp/next.tgz
  # Regenerar SIEMPRE el cliente de Prisma, no solo cuando cambian las
  # dependencias. Ese cliente se arma a partir de prisma/schema.prisma: si el
  # esquema sumo una columna y el cliente quedo viejo, el codigo nuevo le pide
  # a la base un campo que su cliente no conoce y la consulta falla.
  #
  # Paso de verdad: el sitio quedo pidiendo Branch.subdominio contra un
  # cliente generado antes de que esa columna existiera. Como la consulta esta
  # dentro de un try, no se vio ningun error: las dos tiendas mostraban el
  # mismo CUIT y nada en los registros.
  npx prisma generate >/dev/null
  systemctl restart conesa
'"
rm -f /tmp/next.tgz /tmp/mods.tgz

# Espera a que conteste en vez de preguntar una sola vez. Arrancar en la
# maquina chica tarda unos segundos, y preguntar antes de tiempo hacia que
# una publicacion buena pareciera fallada.
echo -n "    esperando a que la tienda conteste"
for i in $(seq 1 30); do
  CODIGO=$(en_la_vm 'curl -s -o /dev/null -w "%{http_code}" localhost:3000' 2>/dev/null | tr -d '\r\n ')
  if [ "$CODIGO" = "200" ]; then
    echo " OK"
    echo "==> Listo. La tienda no se apago: solo se reinicio el programa."
    exit 0
  fi
  echo -n "."
  sleep 4
done

echo
echo "La tienda no contesto despues de dos minutos. Mira que paso:"
echo "  gcloud compute ssh conesa --zone us-central1-a --command 'journalctl -u conesa -n 50'"
exit 1
