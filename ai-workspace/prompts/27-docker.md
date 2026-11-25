# Extra · Docker y despliegue

## Encargo

```text
<el prompt de Docker que enviaste>
```

Fuera del plan, como extra: que se pueda arrancar con un solo
`docker compose up` y desplegar en mi servidor con Portainer.

## Corrección 1

Motivo: el despliegue en mi servidor tiene requisitos que el encargo no
recogía: el acceso público va por un túnel de Cloudflare, así que el puerto
solo debe abrirse en local. Además, la captura de la IA se quedó en
"Cargando divisas…".

```text
<el prompt de los tres ajustes>
```

Resultado: la IA encontró dos problemas que no estaban previstos. El
navegador manda la cabecera Origin también en los POST al mismo dominio, y
el backend los rechazaba con 403; lo resolvió en nginx sin tocar el
backend. Y la imagen de Debian 12 no servía para sqlite3; pasó a Debian 13.
