#!/usr/bin/env bash
# Actualiza la tienda desde Cloud Shell, agrandando la maquina solo para
# compilar y devolviendola chica al terminar.
#
#   bash actualizar-remoto.sh
#
# Por que hace falta: la e2-micro, que es la que entra en el nivel gratuito,
# tiene un cuarto de procesador. Alcanza de sobra para atender la tienda,
# pero no para compilar Next.js: se queda sin credito de velocidad a los
# minutos y despues se arrastra contra el disco sin llegar a terminar. Lo
# probamos el 27/10 y a los 35 minutos seguia en el mismo paso.
#
# Entonces: se agranda, compila, y vuelve a lo de antes. Lo que cuesta es
# el rato de maquina grande, que son centavos, y unos minutos sin servicio.
# Si eso molesta, la alternativa es dejarla en e2-small y pagarla siempre.

set -euo pipefail

VM=${VM:-conesa}
ZONA=${ZONA:-us-central1-a}
CHICA=${CHICA:-e2-micro}
GRANDE=${GRANDE:-e2-medium}

g() { gcloud compute instances "$@" "$VM" --zone "$ZONA" --quiet; }
en_la_vm() { gcloud compute ssh "$VM" --zone "$ZONA" --quiet --command "$1"; }

tamano() {
  gcloud compute instances describe "$VM" --zone "$ZONA" \
    --format='value(machineType)' | sed 's#.*/##'
}

volver_a_chica() {
  if [ "$(tamano)" != "$CHICA" ]; then
    echo "==> Devolviendo la maquina a $CHICA"
    g stop >/dev/null
    g set-machine-type --machine-type "$CHICA" >/dev/null
    g start >/dev/null
  fi
}
# Pase lo que pase -- error, Ctrl+C, compilacion fallida -- la maquina tiene
# que volver a ser chica. Si no, queda una grande encendida cobrando sola.
trap volver_a_chica EXIT

echo "==> Agrandando a $GRANDE para compilar"
g stop >/dev/null
g set-machine-type --machine-type "$GRANDE" >/dev/null
g start >/dev/null

echo "==> Compilando (segui el detalle con: gcloud compute ssh $VM --zone $ZONA --command 'tail -f /var/log/conesa-build.log')"
en_la_vm "sudo /opt/conesa/deploy/actualizar.sh" || {
  echo
  echo "La compilacion fallo. La maquina vuelve a ser chica igual."
  echo "El detalle quedo en /var/log/conesa-build.log"
  exit 1
}

echo "==> Listo"
