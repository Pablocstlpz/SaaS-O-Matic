# Crear CLAUDE.md

## Encargo

```text
Lee ai-workspace/01-SPEC.md y mi skill /arquitectura-angular (SKILL.md y
references/backend-node.md y frontend.md; ignora .NET y Python).

Tarea: crea CLAUDE.md en la raíz y docs/decisiones.md (con el formato de
plantilla/docs/decisiones.md). Sin código de la aplicación.

La skill es el estándar; la spec manda donde choquen. Choques conocidos,
cada uno con su entrada en decisiones.md (qué, por qué, qué se descartó):

- Backend en TypeScript: mismas capas, nombres y carpetas que la plantilla
  Node (que está en JS). Elige y fija el runner de pruebas.
- Sin auth, roles ni organizaciones: fuera login, tokens, asegurarPropietario,
  acceso.js, rate limit de login y scripts crear-admin.
- Rutas de la spec (/customers, /simulations), sin prefijo /api.
- SQLite sin Docker ni migraciones .sql: tablas al arrancar.
- Clientes en tarjetas, no en tabla de Material.
- La API de divisas es externa: su servicio usa HttpClient directamente,
  fuera de BaseHttpService.
- Decide si se queda ngx-translate o solo castellano.

Se mantiene de la skill: capas y sentido de las dependencias, ErrorHttp con
manejador global, formato de error { message, tipo, errors }, constantes
gemelas backend/frontend (límites, tramos, países, planes), JSON en
snake_case igual que la interfaz TS, signals en el padre e input()/output()
en los hijos, puerto 3000.

CLAUDE.md:

- Menos de 120 líneas. Remite a la skill y a la spec, no las copies.
- Dónde va cada regla de la spec (validación fiscal, tramos, impuesto).
- Máximo 200 líneas por fichero y 40 por función.
- Prohibido: any, console.log, try/catch en controladores, HttpClient en
  componentes, la fórmula de precios fuera de su servicio, guardar req.body.
- Comandos que deben pasar antes de dar una tarea por terminada.
- Ante una duda que la spec no cubra: parar y preguntar.

Si encuentras otro choque entre la skill y la spec, pregúntame antes de
escribir. Al terminar, enséñame el diff. Sin commit.
```
