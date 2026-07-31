# Despliegue en contenedor — stuninng-guacamole-ui

**Versión:** 1.0
**Fecha:** 2026-07-25

---

## 1. Resumen

La UI se distribuye como una imagen Docker de dos etapas: build de Angular (`ng build --configuration production`) servido por nginx. Es el **único build** que existe — no hay imágenes separadas por ambiente. Lo que cambia entre ambientes (local, staging, producción) es únicamente la URL del backend, resuelta en runtime al arrancar el contenedor.

## 2. Por qué la API URL no queda fija en la imagen

Antes de esta configuración, los servicios de `core/services` importaban `environments/environment.development.ts` directamente, así que cualquier build (incluso `--configuration production`) quedaba con la IP LAN del entorno de desarrollo (`http://192.168.1.207:4321/api`) grabada en el bundle. Eso hacía imposible reusar la misma imagen contra otro backend sin recompilar.

Ahora:
- El código de la app importa `environments/environment.ts` (el archivo estándar de producción de Angular).
- `ng serve` sigue usando `environment.development.ts` sin cambios, vía `fileReplacements` en la configuración `development` de `angular.json` — el flujo local de siempre no cambia.
- `environment.ts` no trae la URL fija: la lee de `window.__env.apiBaseUrl` en runtime, con `/api` como fallback si no hay nada inyectado.
- `public/assets/env-config.js` es un archivo placeholder (`window.__env = {}`) que se ship por defecto para que `ng serve`/`ng build` no rompan por la falta del archivo. Dentro del contenedor, el entrypoint (`docker/docker-entrypoint.sh`) lo **sobreescribe** en cada arranque generándolo desde `docker/../public/assets/env-config.js.template` con `envsubst`, usando la variable de entorno `API_BASE_URL`.

Resultado: una sola imagen sirve para cualquier backend — solo cambia la variable de entorno al correr el contenedor.

## 3. Build y ejecución local

```bash
docker build -t stuninng-guacamole-ui .
docker run -p 8080:80 -e API_BASE_URL=http://192.168.1.207:4321/api stuninng-guacamole-ui
```

O con docker-compose (crea un `.env` en la raíz con `API_BASE_URL=...`):

```bash
docker compose up --build
```

## 4. Verificación rápida

- `curl http://localhost:8080/assets/env-config.js` debe mostrar la URL real, no el placeholder `${API_BASE_URL}`.
- Cargar `http://localhost:8080` y confirmar en la pestaña Network que las peticiones van al backend configurado.
- Navegar a una ruta interna del dashboard y refrescar el navegador: nginx debe servir `index.html` (fallback SPA vía `try_files` en `docker/nginx.conf`), no un 404.

## 5. Notas de infraestructura

- **HTTPS / Service Worker**: la app registra un Angular Service Worker (`ngsw-config.json`). Los service workers solo se activan sobre HTTPS o `localhost`. Si el contenedor corre detrás de un reverse proxy o balanceador que termina TLS, no se necesita nada adicional aquí; si se expone el contenedor directo por HTTP en producción, el Service Worker simplemente no se activará (la app sigue funcionando, sin el comportamiento offline/PWA).
- **Caché**: `index.html`, `ngsw.json` y `assets/env-config.js` se sirven con `Cache-Control: no-cache` (deben poder cambiar sin quedar atrapados en caché). Los archivos `*.js`/`*.css` con hash en el nombre (`outputHashing: all`) se sirven con caché larga e inmutable.
- **Backend**: la API (hoy en `192.168.1.207:4321`) es un servicio externo, no vive en este repo ni en este `docker-compose.yml`.

## 6. Despliegue en Dokploy

El frontend corre como aplicación tipo **Docker/Dockerfile** en Dokploy (no como "Static Site" ni "Node app"), apuntando este repo/rama (`main`) directamente:

- Dokploy detecta el `Dockerfile` en la raíz y lo builda solo; no requiere `docker-compose.yml` para desplegar un único servicio (ese archivo queda disponible para levantar la UI localmente).
- La variable `API_BASE_URL` se define en la sección **Environment** de la app dentro de Dokploy — no en un `.env` del repo. Dokploy la inyecta al contenedor en runtime, y `docker/docker-entrypoint.sh` la toma para generar `assets/env-config.js` en cada arranque.
- Dokploy gestiona su propio reverse proxy (Traefik) y TLS delante del contenedor; el `Dockerfile` solo expone el puerto 80 vía nginx, tal como está.
- Cualquier redeploy (push a `main`, o rebuild manual desde Dokploy) reconstruye la imagen desde cero — no hace falta ninguna acción manual adicional en el servidor.

## 7. Próximos pasos opcionales (no implementados)

- CI/CD para build y push automático de la imagen a un registro (GHCR/Docker Hub/ECR) antes del deploy en Dokploy, si se quiere desacoplar el build del propio Dokploy.

Esto queda pendiente de decisión del usuario; no se implementó como parte de este cambio.
