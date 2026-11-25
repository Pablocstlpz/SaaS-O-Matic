# Extra · Docker y despliegue

## Encargo

```text
Responde en castellano.

Extra fuera del plan: preparar la app para ejecutarse con Docker, en local y
en mi servidor (Linux ARM64).

- backend/Dockerfile: Node 22, compila TypeScript, sin dependencias de
  desarrollo en la imagen final. La base de datos SQLite en un volumen, para
  que no se pierda al recrear el contenedor. Que cargue los datos de ejemplo
  la primera vez si la base está vacía.
- frontend/Dockerfile: compila Angular y lo sirve con nginx. nginx pasa
  /customers, /simulations y /salud al backend, y el resto a la app (con
  vuelta a index.html para las rutas de Angular). Así todo va desde el mismo
  origen: la apiUrl de producción queda vacía y no hace falta tocar CORS.
- docker-compose.yml en la raíz: los dos servicios, el volumen y solo el
  puerto del frontend expuesto.
- Que funcione en amd64 y arm64.
- Añade al README una sección "Con Docker": docker compose up --build y la URL.
- Anótalo en docs/decisiones.md.

Pruébalo: levanta el compose en local, recorre la app en el navegador y
comprueba que los datos sobreviven a un docker compose down y up. No toques
el arranque sin Docker: tiene que seguir funcionando igual. Sin commit.
```

Fuera del plan, como extra: que se pueda arrancar con un solo
`docker compose up` y desplegar en mi servidor con Portainer.

## Corrección 1

Motivo: el despliegue en mi servidor tiene requisitos que el encargo no
recogía: el acceso público va por un túnel de Cloudflare, así que el puerto
solo debe abrirse en local. Además, la captura de la IA se quedó en
"Cargando divisas…".

```text
Antes del commit, tres ajustes para mi servidor:

1. Publica el frontend solo en local: "127.0.0.1:${PUERTO:-8080}:80". En mi
   servidor el acceso público va por un túnel de Cloudflare, y no quiero el
   puerto abierto en todas las interfaces.
2. Fija el nombre del proyecto en el compose (name: saas-o-matic), para que
   el volumen se llame igual en cualquier equipo y no dependa de la carpeta.
3. En tu captura se quedó en "Cargando divisas…". Comprueba que nginx no
   añade una cabecera Content-Security-Policy que bloquee open.er-api.com, y
   que pasados 5 s sin respuesta pasa a euros con el aviso, como dice la spec.

Sin commit.
```

Resultado: la IA encontró dos problemas que no estaban previstos. El
navegador manda la cabecera Origin también en los POST al mismo dominio, y
el backend los rechazaba con 403; lo resolvió en nginx sin tocar el
backend. Y la imagen de Debian 12 no servía para sqlite3; pasó a Debian 13.
