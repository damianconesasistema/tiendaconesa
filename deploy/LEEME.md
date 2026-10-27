# Mudar la tienda a una VM de Google Cloud

Todo en una sola maquina: la pagina, la base de datos y los respaldos.

## Lo que cuesta

| Concepto | Por mes |
|---|---|
| La maquina (e2-micro, free tier) | US$ 0 |
| Disco 30 GB **standard** (free tier) | US$ 0 |
| **Direccion IP publica** | **~US$ 3,65** |
| Respaldos en Cloud Storage (5 GB gratis) | US$ 0 |
| Trafico de salida arriba de 1 GB | ~US$ 0,12 por GB |

Total realista: **US$ 4 al mes**. La VM es gratis; la IP publica no lo es
desde febrero de 2024.

Ojo con dos cosas que la consola propone mal por defecto y que si se dejan
asi se pagan: el **tipo de disco** (viene "Balanced", hay que poner
"Standard") y la **region** (tiene que ser una de las tres del free tier).

## 1. Crear la cuenta y la maquina

Esto lo tiene que hacer Damian: hay que poner una tarjeta y aceptar
condiciones, y eso no lo puede hacer el asistente.

1. Entrar a **console.cloud.google.com** y crear la cuenta. Pide tarjeta
   para verificar.
2. Crear un proyecto llamado **conesa**.
3. Ir a **Compute Engine > Instancias de VM > Crear instancia** y poner:

   - Nombre: `conesa`
   - Region: **us-central1 (Iowa)** — tiene que ser esta, us-west1 o
     us-east1; cualquier otra se paga
   - Tipo de maquina: serie **E2** > **e2-micro**
   - Disco de arranque: **Debian 12**, tipo **Standard persistent disk**,
     **30 GB**
   - Firewall: tildar **Permitir trafico HTTP** y **Permitir trafico HTTPS**

4. Crear. Cuando este lista, boton **SSH** (abre una terminal en el
   navegador).

## 2. Preparar el servidor

Ya dentro de la terminal de la VM, una sola linea:

```
curl -fsSL https://raw.githubusercontent.com/damianconesasistema/tiendaconesa/main/deploy/setup-vm.sh | sudo bash
```

Si el repositorio es privado va a pedir usuario y token de GitHub. En ese
caso conviene copiar el archivo a mano (abrirlo en la PC, copiar el texto,
pegarlo en la VM con `nano setup-vm.sh`) y correr `sudo bash setup-vm.sh`.

Eso instala Node, Postgres afinado para 1 GB de memoria, nginx, el servicio
que arranca la tienda sola, y el respaldo de todas las noches.

## 3. Cargar las claves

```
sudo nano /etc/conesa.env
```

La de la base ya quedo puesta sola. Faltan MercadoPago, Resend, el panel y
analitica. **Hay que generar nuevas**, no reusar las de Railway: estuvieron
expuestas en el incidente del 21/10/2026.

Guardar con `Ctrl+O`, salir con `Ctrl+X`.

## 4. Compilar y arrancar

```
sudo /opt/conesa/deploy/actualizar.sh
```

Tarda bastante: en una maquina de 1 GB compilar Next.js son varios minutos.
Al terminar, la tienda ya responde en la IP de la VM.

## 5. Cargar el catalogo

Desde la PC, con los tres Excel a mano:

```
node prisma/restaurar-catalogo.mjs
node prisma/restaurar-fotos.mjs
```

Necesitan `DATABASE_URL` apuntando a la VM. Para eso hay que abrir el
puerto de Postgres o correrlos desde la propia VM; lo mas simple es copiar
los Excel y las fotos a la VM y correrlos ahi.

## 6. Apuntar el dominio y poner el candadito

1. En Cloudflare, cambiar el registro de `conesa.com.ar` y de `www` a la IP
   de la VM.
2. Conviene **reservar la IP** (Red VPC > Direcciones IP > Reservar) para que
   no cambie al reiniciar la maquina. Reservada y en uso cuesta lo mismo.
3. Cuando el dominio ya resuelva a la VM:

```
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d conesa.com.ar -d www.conesa.com.ar
```

## 7. Respaldos afuera de la maquina

El respaldo diario queda en `/var/backups/conesa`, 14 dias para atras. Eso
no alcanza: si se pierde la VM, se pierde con ella. Para que suba tambien a
Google Cloud Storage (5 GB gratis):

1. Crear un deposito en **Cloud Storage > Buckets**, region `us-central1`,
   clase Standard.
2. Poner el nombre en `BUCKET=` dentro de `/etc/conesa.env`.
3. Probar: `sudo /usr/local/bin/conesa-backup`

## Comandos del dia a dia

| Para que | Comando |
|---|---|
| Subir cambios | `sudo /opt/conesa/deploy/actualizar.sh` |
| Ver si esta andando | `systemctl status conesa` |
| Ver errores | `journalctl -u conesa -n 50` |
| Reiniciar | `sudo systemctl restart conesa` |
| Respaldar ahora | `sudo /usr/local/bin/conesa-backup` |
| Ver los respaldos | `ls -lh /var/backups/conesa` |

## Volver atras un respaldo

```
sudo systemctl stop conesa
gunzip -c /var/backups/conesa/conesa-FECHA.sql.gz | sudo -u postgres psql conesa
sudo systemctl start conesa
```
