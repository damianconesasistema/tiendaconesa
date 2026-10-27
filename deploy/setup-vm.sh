#!/usr/bin/env bash
# Prepara una VM nueva de Google Cloud (Debian 12, e2-micro) para correr
# TODA la tienda: la pagina y la base de datos en la misma maquina.
# Se corre UNA sola vez, recien creada la maquina, con sudo:
#
#   sudo bash setup-vm.sh
#
# Deja andando: swap, Postgres afinado para 1 GB de RAM, la tienda como
# servicio que arranca sola al prender la maquina, nginx adelante, y el
# respaldo de la base todas las noches.
#
# Lo que NO hace: cargar las claves (van en /etc/conesa.env) ni el
# certificado HTTPS (va al final, cuando el dominio ya apunte aca).

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

REPO="${REPO:-https://github.com/damianconesasistema/tiendaconesa.git}"
DESTINO=/opt/conesa

echo "==> 1/7 Memoria de intercambio (swap)"
# La e2-micro tiene 1 GB de RAM. Compilar Next.js necesita mas, y encima
# ahora comparte la maquina con Postgres. El swap es disco usado como
# memoria: lento, pero evita que algo muera por falta de aire.
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
  echo "vm.swappiness=20" > /etc/sysctl.d/99-conesa.conf
  sysctl -q -w vm.swappiness=20
fi

echo "==> 2/7 Paquetes base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git nginx curl ca-certificates gnupg postgresql postgresql-client

echo "==> 3/7 Node 22"
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
echo "    node $(node --version)"

echo "==> 4/7 Base de datos"
# Postgres por defecto asume una maquina grande. Con 1 GB hay que bajarlo o
# se pelea por memoria con la pagina.
CONF=$(ls -d /etc/postgresql/*/main | head -1)
mkdir -p "$CONF/conf.d"
cat > "$CONF/conf.d/conesa.conf" <<'PG'
# Afinado para una maquina de 1 GB compartida con la aplicacion.
shared_buffers = 128MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 48MB
max_connections = 20
PG
grep -q "^include_dir" "$CONF/postgresql.conf" || echo "include_dir = 'conf.d'" >> "$CONF/postgresql.conf"
systemctl restart postgresql

# El usuario y la base, solo si no existen. La contrasena se genera sola y
# queda en /etc/conesa.env: no la elige nadie ni pasa por el repositorio.
EXISTE=$(su postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='conesa'\"")
if [ "$EXISTE" != "1" ]; then
  CLAVE=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)
  su postgres -c "psql -q -c \"CREATE ROLE conesa LOGIN PASSWORD '$CLAVE'\""
  su postgres -c "createdb -O conesa conesa"
  printf '%s' "$CLAVE" > /etc/conesa.db-pass
  chmod 600 /etc/conesa.db-pass
  echo "    base creada"
else
  echo "    la base ya existia, no se toca"
fi

echo "==> 5/7 Codigo en $DESTINO"
if [ -d "$DESTINO/.git" ]; then
  git -C "$DESTINO" pull --ff-only
else
  git clone --depth 1 "$REPO" "$DESTINO"
fi

echo "==> 6/7 Variables de entorno"
if [ ! -f /etc/conesa.env ]; then
  cp "$DESTINO/deploy/conesa.env.ejemplo" /etc/conesa.env
  chmod 600 /etc/conesa.env
  if [ -f /etc/conesa.db-pass ]; then
    CLAVE=$(cat /etc/conesa.db-pass)
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"postgresql://conesa:$CLAVE@localhost:5432/conesa\"|" /etc/conesa.env
    echo "    DATABASE_URL cargada sola"
  fi
  echo "    ! Faltan las demas claves en /etc/conesa.env"
fi

echo "==> 7/7 Servicio, nginx y respaldo"
cp "$DESTINO/deploy/conesa.service" /etc/systemd/system/conesa.service
cp "$DESTINO/deploy/nginx-conesa.conf" /etc/nginx/sites-available/conesa
ln -sf /etc/nginx/sites-available/conesa /etc/nginx/sites-enabled/conesa
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null && systemctl reload nginx
systemctl daemon-reload
systemctl enable -q conesa

# Respaldo todas las noches a las 3. Esto es justamente lo que no tenia
# Railway y por eso se perdio todo.
install -m 755 "$DESTINO/deploy/backup.sh" /usr/local/bin/conesa-backup
mkdir -p /var/backups/conesa
echo "0 3 * * * root /usr/local/bin/conesa-backup >> /var/log/conesa-backup.log 2>&1" > /etc/cron.d/conesa-backup

cat <<'FIN'

===========================================================
Servidor listo. Faltan dos pasos:

  1) Completar las claves:
       sudo nano /etc/conesa.env
     (la base ya quedo cargada sola; faltan MercadoPago, mail, etc.)
     Guardar con Ctrl+O, salir con Ctrl+X.

  2) Compilar y arrancar la tienda:
       sudo /opt/conesa/deploy/actualizar.sh

Despues, cuando conesa.com.ar ya apunte a esta VM, el candadito:
       sudo apt install -y certbot python3-certbot-nginx
       sudo certbot --nginx -d conesa.com.ar -d www.conesa.com.ar
===========================================================
FIN
