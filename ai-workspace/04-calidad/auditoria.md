# Auditoría

## `npm audit` (2026-11-25)

«Producción» es lo que corre con la app en uso: el backend con `npm start` y el JavaScript que el
frontend compila para el navegador. «Desarrollo» es lo que solo se usa para compilar, servir en local o
probar (`ng build`, `ng serve`, Vitest).

### Backend

Sin avisos altos ni críticos. Hay dos moderados, que se dejan:

| Paquete                    | Gravedad | Uso        | Arreglo sin cambiar de versión mayor                                   |
| -------------------------- | -------- | ---------- | ---------------------------------------------------------------------- |
| `uuid` 8.3.2 (`sequelize`) | moderada | producción | No. `npm audit fix --force` bajaría Sequelize a la 3, que rompe la app |

El fallo de `uuid` (GHSA-w5hq-g745-h8pq) está en v3, v5 y v6 cuando se les pasa un `buf`. Sequelize 6
solo llama a `v1()` y `v4()`, y sin argumentos, así que no afecta a la app. `npm audit` cuenta dos porque marca también `sequelize`.

### Frontend

Antes del arreglo: 23 avisos (5 altos, 18 moderados). Ninguno crítico. **Los cinco altos eran de
desarrollo:** `npm audit --omit=dev` da 0, y en el código que llega al navegador (Angular, Material,
RxJS, tslib) no hay ninguno.

| Paquete (altos)                    | Llega por                                         | Uso        | Arreglo sin versión mayor | Hecho     |
| ---------------------------------- | ------------------------------------------------- | ---------- | ------------------------- | --------- |
| `vite` 7.3.6                       | `@angular/build` (`ng serve`, `ng build`), Vitest | desarrollo | Sí: 7.3.8                 | Corregido |
| `undici` 7.29.1                    | `@angular/build`, `jsdom` (pruebas)               | desarrollo | Sí: 7.30.1                | Corregido |
| `@modelcontextprotocol/sdk` 1.31.0 | `@angular/cli` (`ng mcp`)                         | desarrollo | Sí: 1.32.1                | Corregido |
| `body-parser` 2.3.0                | `@angular/cli` → SDK de MCP → `express`           | desarrollo | Sí: 2.4.0                 | Corregido |
| `@angular/cli` 21.2.27             | marcado por el SDK de MCP                         | desarrollo | Sí: 21.2.31               | Corregido |

Cómo se arregló: `npm audit fix` falla en npm 10.9.8 (`Cannot read properties of null (reading
'edgesOut')`), y `npm update` no sube `@angular/build` porque los paquetes de Angular tienen que moverse
juntos. Se subieron en `package-lock.json`, sin tocar `package.json` (todo cabe en los `^21` que ya
había):

- `@angular/build`, `@angular/cli`, `@angular-devkit/*` y `@schematics/angular`: 21.2.27 → 21.2.31.
- `@angular/common`, `compiler`, `compiler-cli`, `core`, `forms`, `platform-browser` y `router`:
  21.2.25 → 21.2.26.
- Con ellos, `vite` 7.3.8, `undici` 7.30.1, `@modelcontextprotocol/sdk` 1.32.1 y `body-parser` 2.4.0.

El lock cambia solo en esas entradas. `npm ci` funciona con npm 10.9.8 y con npm 11.6.2 (el de
`packageManager`).

Después: 18 moderados, 0 altos, 0 críticos. Todos de desarrollo. Se dejan:

- **16 de la cadena de `@angular/cli`** (`pacote`, `sigstore`, `tuf-js`, `minimatch`, `glob`,
  `cacache`, `make-fetch-happen`, `npm-registry-fetch`…): solo se arreglan con `@angular/cli` 22, que
  es versión mayor.
- **`hono` y `@hono/node-server`** (por el SDK de MCP de `@angular/cli`): tienen arreglo sin versión
  mayor, pero son moderados y solo se usan si se arranca `ng mcp`. Se apuntan y no se tocan.
