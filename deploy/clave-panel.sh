#!/usr/bin/env bash
# Cambia la contrasena del panel de administracion.
#
#   sudo bash clave-panel.sh /ruta/al/archivo-con-la-clave
#
# La clave entra por archivo y no por parametro a proposito. Si fuera un
# parametro quedaria en el historial del shell y a la vista de cualquiera que
# liste los procesos mientras corre; y si ademas tuviera comillas, $ o |, el
# shell la partiria y se guardaria otra cosa. Leyendola de un archivo no la
# toca ningun shell.
#
# El archivo se borra a fondo al terminar.

set -euo pipefail
[ "$(id -u)" = "0" ] || { echo "Correlo con sudo"; exit 1; }

ORIGEN="${1:-}"
ENV=/etc/conesa.env
[ -n "$ORIGEN" ] && [ -f "$ORIGEN" ] || { echo "Falta el archivo con la clave"; exit 1; }

CLAVE=$(cat "$ORIGEN")
[ ${#CLAVE} -ge 8 ] || { echo "Muy corta: poné 8 caracteres o más"; exit 1; }

TMP=$(mktemp)
chmod 600 "$TMP"
grep -v '^ADMIN_PASSWORD=' "$ENV" > "$TMP"
printf 'ADMIN_PASSWORD=%s\n' "$CLAVE" >> "$TMP"
install -m 600 "$TMP" "$ENV"
shred -u "$TMP"

# Queda tambien suelta en un archivo que solo lee root, para poder
# recuperarla sin tener que volver a cambiarla.
printf '%s\n' "$CLAVE" > /etc/conesa.admin-pass
chmod 600 /etc/conesa.admin-pass
shred -u "$ORIGEN"

systemctl restart conesa
echo "Contrasena cambiada (${#CLAVE} caracteres). El panel ya la pide."
echo "Si alguna vez te la olvidas:  sudo cat /etc/conesa.admin-pass"
