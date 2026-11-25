# Backend Node.js (Express 5 + Sequelize)

Léelo entero antes de tocar un backend Node. El código de ejemplo de cada carpeta
está en `plantilla/backend-node/backend/`. Ábrelo: los ficheros son cortos y sus
comentarios explican el porqué de cada decisión.

Contenido: 1 Árbol · 2 Librerías · 3 Nombres · 4 Cada capa · 5 Relaciones entre
recursos · 6 Unicidad · 7 Esquema y migraciones · 8 Pruebas · 9 Tareas de consola
· 10 Copiar `productos` para un recurso nuevo · 11 Extensiones

---

## 1. Árbol

```
backend/
├── package.json            "type": "module"; scripts dev · start · test · crear-admin · crear-usuario
├── package-lock.json
├── Dockerfile  .dockerignore
├── migraciones/
│   └── LEEME.md            NNN-descripcion.sql: cambios en tablas que ya existen (§7)
├── scripts/
│   └── crear-usuario.js    primer admin o usuarios normales desde la consola (§9)
├── tests/
│   ├── _api.js             lo común: levantar la app, sembrar datos, entrar, hacer peticiones
│   ├── auth.test.js        sesión: login, 401, renovar, /yo (se conserva al borrar productos)
│   ├── migraciones.test.js migrar(): BD vacía y .sql pendientes (se conserva)
│   └── productos.test.js   un recurso: feliz, 400, 401, 403, 404 ajeno, 409, DUPLICADO
└── src/
    ├── server.js           arranque: valida config → conecta → migra → listen. Si algo falla, sale con 1
    ├── app.js              composición: helmet, CORS, json, routers, 404, manejador de errores. Exporta `app`
    ├── config.js           ÚNICA lectura de process.env + validarConfig()
    ├── data/
    │   ├── db.js           la conexión
    │   └── migraciones.js  migrar(): crea las tablas que faltan y aplica migraciones/*.sql pendientes
    ├── models/
    │   ├── producto.model.js           una entidad (singular), índice único (organizacion_id, nombre)
    │   ├── usuario.model.js            con toJSON que quita el hash
    │   ├── organizacion.model.js       el inquilino (sobra si el propietario no es la organización)
    │   └── associations.js             todas las relaciones, importado una vez desde app.js
    ├── routes/
    │   ├── productos.route.js          método + ruta + middlewares + validador + controlador
    │   └── auth.route.js               login, renovar sesión, usuario actual
    ├── middlewares/
    │   ├── auth.middleware.js          autenticar + autorizar(...roles)
    │   └── rateLimit.middleware.js     un limitador por tipo de endpoint sensible
    ├── validators/
    │   ├── _handle.js                  comprobarValidacion: el 400 único de toda la API
    │   ├── productos.validator.js      reglas(paraCrear) + validarIdParam
    │   └── auth.validator.js
    ├── controllers/
    │   ├── productos.controller.js     listar · obtener · crear · actualizar · eliminar
    │   └── auth.controller.js
    ├── services/
    │   └── productos.service.js        regla usada desde dos acciones (nombre libre → 409)
    └── utils/
        ├── errores.js                  ErrorHttp(status, message, tipo) y atajos
        ├── acceso.js                   organizacionDe(req) · asegurarPropietario(req, recurso)
        ├── seguridad.js                bcrypt y tokens de sesión
        ├── logger.js                   con redacción de campos sensibles
        └── regex.js                    regex, enumerados y LIMITES (gemelo de shared/regex.ts)
```

Composición (`app.js`): `helmet` → `cors` con lista blanca → `express.json({ limit })`
→ `import "./models/associations.js"` → un `app.use("/api/<recursos>", router)` por
recurso → `GET /api/salud` → 404 `{ message }` → manejador de errores. El manejador
traduce, en este orden: `ErrorHttp` → su código; JSON mal formado
(`entity.parse.failed`) → 400; `SequelizeUniqueConstraintError` → 409 `DUPLICADO`;
cualquier otra cosa → 500 genérico con el detalle solo en el log.

## 2. Librerías

| Paquete | Para qué | Dónde se usa |
|---|---|---|
| `express` 5 | Servidor HTTP; lleva solo los errores de los `async` al manejador | `app.js`, `routes/` |
| `express-validator` | Formato de la entrada | `validators/` |
| `helmet` · `cors` | Cabeceras de seguridad · lista blanca de orígenes | `app.js` |
| `express-rate-limit` | Freno a la fuerza bruta en endpoints sensibles | `middlewares/rateLimit.middleware.js` |
| `jsonwebtoken` · `bcrypt` | Tokens de sesión · hash de contraseñas | `utils/seguridad.js` |
| `sequelize` + `mysql2` | Modelos y conexión (MySQL/MariaDB) | `data/`, `models/` |
| `dotenv` | Lee el `.env` | solo `config.js` |
| `sqlite3` (dev) | BD en memoria para las pruebas | `tests/` |

Pruebas con `node --test` (viene con Node). Con PostgreSQL: `pg` en vez de `mysql2` y
el dialecto en `data/db.js`; nada más cambia. Opcionales (solo si el proyecto lo
necesita): `nodemailer` (correo), `stripe` (pagos), `google-auth-library`
(entrar con Google). Ver §11.

## 3. Nombres

| Pieza | Convención | Ejemplo |
|---|---|---|
| Carpetas | minúscula, inglés [O] | `controllers/`, `models/` |
| Fichero | `camelCase.<capa>.js` [O] | `lineasPedido.controller.js`, `lineaPedido.model.js` |
| Entidad | singular, PascalCase [O] | `LineaPedido` |
| Router, validador, controlador | plural del recurso | `lineasPedido.route.js` |
| Funciones del controlador | `listarX` · `obtenerX` · `crearX` · `actualizarX` · `eliminarX` | `listarLineasPedido` |
| Validadores | `validarCrearX` · `validarActualizarX` · `validarIdParam` | |
| Middlewares | verbo [O] | `autenticar`, `autorizar("admin")` |
| Constantes | `MAYUSCULAS` [O] | `LIMITES.EMAIL_MAX`, `ESTADOS_PRODUCTO` |
| Rutas HTTP | plural, kebab-case | `/api/lineas-pedido/:id` |
| Imports | ESM con extensión explícita y exportaciones con nombre; sin `export default` en el dominio [O] | `import { Producto } from "../models/producto.model.js"` |

## 4. Cada capa

**Validador** (`validators/<recursos>.validator.js`). Una función
`reglas(paraCrear)` que marca los campos obligatorios al crear y opcionales al
actualizar, para no escribir dos listas que se desincronizan. Toda ruta con `:id`
lleva `validarIdParam`. Las longitudes salen de `LIMITES`. Al final de cada cadena,
`comprobarValidacion` (de `_handle.js`), que es el único sitio que responde el 400:
`{ message, errors: [{ campo, mensaje }] }`. Para texto: `.trim().notEmpty()`
también en la rama opcional, o `"   "` pasa como nombre. Un validador **no
consulta la BD**: «¿existe la categoría?» es negocio (§5).

**Controlador** (`controllers/<recursos>.controller.js`). Sin `try/catch`: Express 5
lleva al manejador lo que lanza un `async`. Por acción:

1. el propietario sale del token (`organizacionDe(req)`), nunca de `req.body` ni de la URL;
2. el recurso se carga y pasa por `asegurarPropietario(req, recurso)` → 404 si es ajeno;
3. la regla de negocio lanza `ErrorHttp` (atajos `noEncontrado`, `conflicto`, `prohibido`);
4. se guardan **solo** los campos permitidos: `const { nombre, precio } = req.body`,
   nunca `Modelo.create(req.body)` ni `update(req.body)`;
5. se responde `201` con la entidad al crear, `200` con la entidad al leer o
   actualizar, `200 { message }` al borrar, `200 []` con una lista vacía.

**Servicio** (`services/<recurso>.service.js`), solo si la regla se usa desde dos
sitios (dos acciones, dos controladores, middleware o trabajo), si el controlador
pasa de ~300 líneas o si coordina varias entidades. Recibe datos (no `req`) y
devuelve datos o lanza `ErrorHttp`. `comprobarNombreLibre` lo usan crear y
actualizar: por eso existe.

**Rutas** (`routes/<recursos>.route.js`). Públicas arriba con su rate limit; luego
`router.use(autenticar)`; cada ruta que escribe con `autorizar(...)` (las de leer
las puede usar cualquier rol de la organización), validador y controlador.
Rutas literales antes que `/:id` (`/pedidos/finanzas` antes de `/pedidos/:id`), o
Express toma «finanzas» por un id. Cada router se monta en **su** prefijo: si
todos van a `/api`, el `router.use(autenticar)` de uno se aplica a las rutas de los
que vienen detrás.

**Modelo** (`models/<entidad>.model.js`). `tableName` explícito, columnas en
snake_case, `createdAt: "fecha_creacion"`, `updatedAt: "fecha_actualizacion"`.
Los campos sensibles se quitan en `toJSON` del propio modelo, no en cada
controlador. `DECIMAL` llega como texto desde MySQL: el `get()` del precio lo
convierte a número para que el contrato no cambie según el motor.

**Configuración** (`config.js`). Único fichero que lee `process.env`. `validarConfig()`
lista las obligatorias y hace `process.exit(1)` con un mensaje que dice qué falta y
dónde ponerlo. `server.js` lo llama **antes** de importar `app.js` (los `import`
estáticos se evalúan antes que cualquier línea). Toda variable nueva va también en
`.env.example`, comentada.

**Log** (`utils/logger.js`). `logger.info|warn|error(contexto, mensaje, datos?)`,
redacta contraseñas y tokens. Nada de `console.log` suelto.

## 5. Relaciones entre recursos

Ejemplo: los productos tienen una categoría opcional.

```js
// models/associations.js — SIEMPRE con `as` y `foreignKey` explícitos.
// Sin `as`, Sequelize deriva el alias con reglas de inglés: "Categoria" se
// singulariza a "Categorium" y el include devuelve un campo con ese nombre.
Categoria.hasMany(Producto, { foreignKey: "categoria_id", as: "productos", onDelete: "RESTRICT" });
Producto.belongsTo(Categoria, { foreignKey: "categoria_id", as: "categoria", onDelete: "RESTRICT" });
```

`onDelete` **siempre explícito**: con una clave ajena obligatoria Sequelize pone
`CASCADE` por defecto, y borrar una categoría borraría en silencio todos sus
productos. `RESTRICT` deja que la BD lo impida (y el controlador responde antes 409
`EN_USO`); `SET NULL` solo si la referencia es opcional y el negocio quiere desvincular.

La referencia que llega en el cuerpo (`categoria_id`) se comprueba en el
controlador o en un servicio: tiene que existir **y ser del mismo propietario**. Si
no, 400 con `tipo`, igual exista en otra organización o no exista (así no se
confirma nada):

```js
// utils/acceso.js — junto a asegurarPropietario
// import { ErrorHttp, noEncontrado } from "./errores.js";   (hoy solo importa noEncontrado)
export const asegurarReferencia = async (req, Modelo, id, etiqueta) => {
  if (id == null) return null; // referencia opcional que no llega
  const recurso = await Modelo.findByPk(id);
  if (!recurso || String(recurso.organizacion_id) !== String(organizacionDe(req))) {
    throw new ErrorHttp(400, `${etiqueta} no existe`, "REFERENCIA_INVALIDA");
  }
  return recurso;
};
// uso: await asegurarReferencia(req, Categoria, categoria_id, "La categoría");
```

- La respuesta lleva siempre el id (`categoria_id`) y, si la pantalla necesita el
  nombre, el objeto anidado con `include: [{ model: Categoria, as: "categoria",
  attributes: ["id", "nombre"] }]`. El frontend no hace una petición por fila.
- Borrar algo referenciado: 409 `{ message, tipo: "EN_USO" }` contando los
  dependientes antes de borrar, salvo que el negocio diga otra cosa (desvincular
  con `onDelete: "SET NULL"`). Se decide y se prueba.
- Un recurso hijo que solo se edita dentro del padre (líneas de un pedido) va
  anidado en el cuerpo y en la respuesta del padre; si tiene pantalla propia, su
  router en `/api/<padre>/:padre_id/<hijos>`.

## 6. Unicidad

Comprobar antes de insertar (`comprobarNombreLibre`) da un buen mensaje
(`NOMBRE_REPETIDO`, que el formulario pinta junto al campo), pero no es atómico: dos
peticiones a la vez pasan las dos la comprobación. Por eso van **las dos cosas**:

1. índice único en el modelo: `indexes: [{ name: "productos_organizacion_nombre",
   unique: true, fields: ["organizacion_id", "nombre"] }]`;
2. el manejador de `app.js` traduce `SequelizeUniqueConstraintError` a
   `409 { message: "Ya existe un registro con esos datos", tipo: "DUPLICADO" }`.

## 7. Esquema y migraciones

`server.js` llama a `migrar()` (`src/data/migraciones.js`) en todos los entornos,
después de conectar y antes de escuchar:

- **BD vacía** (desarrollo, pruebas, primera instalación): `sequelize.sync()` crea
  todas las tablas con el modelo de hoy y las migraciones se apuntan sin ejecutarse.
- **BD con datos**, en este orden: (1) crea solo las tablas que **faltan**, para que
  una migración pueda rellenarlas; (2) aplica los `backend/migraciones/NNN-*.sql`
  que aún no estén en la tabla `migraciones`, y los apunta; (3) `sync()` sin `alter`
  para los índices con nombre que falten, que ya encuentran sus columnas. Un `sync()`
  al principio intentaría indexar una columna que aún no existe y pararía el
  arranque (lo vigila `tests/migraciones.test.js`).

`sync()` **no añade columnas a tablas que ya existen**. Añadir un campo al modelo
funciona en tu BD de pruebas (que se crea de cero) y falla en producción (la tabla
ya existe sin esa columna). Por eso el cambio va **en los dos sitios**: en el modelo
(para las BD nuevas) y en una migración (para las que ya existen):

```sql
-- backend/migraciones/001-categoria-en-productos.sql
ALTER TABLE productos ADD COLUMN categoria_id INTEGER NULL;
```

```js
// models/producto.model.js
categoria_id: { type: DataTypes.INTEGER, allowNull: true },
```

- En una BD **vacía** las migraciones se apuntan sin ejecutarse: `sync()` ya crea
  las tablas con el modelo de hoy y el `ALTER` fallaría por columna repetida.
- Una tabla **nueva** no necesita migración (la crea `sync()`). Un índice declarado
  en el modelo **con `name`** tampoco: `sync()` añade los índices con nombre que
  falten también en tablas existentes, y una migración que lo cree fallaría.
- Una migración aplicada no se edita ni se renombra nunca: se escribe otra. Nombres
  con tres cifras (`001-`, `002-`) para que el orden sea el de aplicación.
- La API aplica las migraciones al arrancar, antes de escuchar: desplegar es
  copia de la BD → subir la versión nueva. Con varias instancias, que migre solo una
  (las demás esperan) o se migra como paso previo del despliegue.
- Las migraciones se escriben en el SQL del **motor de producción** (MySQL en la
  plantilla): en las pruebas no se ejecutan, porque la BD de SQLite nace vacía. Se
  ensayan contra una copia de la BD de producción antes de desplegar.
- Un proyecto que nació de una versión anterior de la plantilla (sin migraciones):
  se copian `src/data/migraciones.js` y `migraciones/`, se cambia el `sync()` de
  `server.js` por `migrar()` y se añade `migraciones/` al `Dockerfile`. En su primer
  arranque la tabla `migraciones` no existe, pero las demás sí: aplica todo lo
  pendiente, que es lo correcto.
- Una referencia **obligatoria** nueva en una tabla con filas (cada producto
  necesita categoría): la migración crea la categoría por defecto («General») para
  cada organización, añade la columna `NULL`, rellena las filas y, en MySQL, termina
  con `ALTER TABLE … MODIFY categoria_id INTEGER NOT NULL`. El modelo la declara
  `allowNull: false` y el validador la exige.
- Si una columna nueva es obligatoria en una tabla con filas, la migración la crea
  con un valor por defecto o en dos pasos (`NULL`, rellenar, `NOT NULL`). No se usa `sync({ alter: true })` ni
`sync({ force: true })` fuera de las pruebas: el primero puede borrar datos al
cambiar tipos y el segundo los borra siempre.

## 8. Pruebas

`node --test` contra la `app` real (por eso `listen` vive en `server.js`) y SQLite en
memoria. `tests/_api.js` levanta la app en un puerto libre, ejecuta `migrar()`,
siembra dos organizaciones (con un admin y un usuario la primera) y da `entrar()` y
`peticion()`. Cada recurso tiene su fichero `tests/<recursos>.test.js`. Mínimo por
recurso:

| Prueba | Qué protege |
|---|---|
| Camino feliz (crear → listar → obtener → actualizar → borrar) | Que funciona |
| 400 con campo mal formado y con nombre en blanco | La validación |
| 401 sin token | Que todo el recurso exige sesión |
| 403 con un rol sin permiso, en **cada** acción que escribe | La autorización (quitar el permiso de una sola acción tiene que poner algo en rojo) |
| 404 al leer, cambiar o borrar un recurso de otra organización | El aislamiento |
| 409 con la regla de negocio, si el recurso tiene alguna (unicidad, estado) | La regla |
| 400 `REFERENCIA_INVALIDA` con una referencia de otra organización, si hay relaciones | Las relaciones (§5) |

El login tiene rate limit (20 intentos cada 15 min por IP): `entrar()` de
`tests/_api.js` entra una vez por usuario y reutiliza el token. No llames al login
en un bucle desde las pruebas de un recurso o acabarás en 429.

Una carrera (dos altas a la vez) se prueba sin depender de la suerte: con
`t.mock.method(Producto, "findOne", async () => null)` la comprobación del
servicio no ve al primero y la segunda petición choca con el índice → 409
`DUPLICADO` (lo hace `productos.test.js`).

**Una prueba que no falla sin el cambio no prueba nada.** Antes de darla por buena,
rompe a propósito lo que protege (quita el filtro por organización, el `unique`, la
traducción del error…), comprueba que se pone roja, y deshazlo.

## 9. Tareas de consola

```bash
npm run crear-admin   -- "Mi empresa" ana@correo.com 'Contraseña1!'   # rol admin
npm run crear-usuario -- "Mi empresa" luis@correo.com 'Contraseña1!'  # rol usuario
```

Crean la organización si no existe, validan email y contraseña con las mismas
reglas que la API y no duplican un email. Una tarea nueva de consola es otro
fichero en `scripts/` con su entrada en `package.json`.

## 10. Copiar `productos` para un recurso nuevo

Ejemplo `clientes`: copia y renombra (`producto` → `cliente`, `productos` →
`clientes`, `Producto` → `Cliente`), cambia los campos y monta.

```
src/models/cliente.model.js               ← producto.model.js (campos, índices)
src/models/associations.js                + relaciones con `as` (§5)
src/validators/clientes.validator.js      ← productos.validator.js
src/controllers/clientes.controller.js    ← productos.controller.js
src/routes/clientes.route.js              ← productos.route.js
src/app.js                                + app.use("/api/clientes", clientesRoutes)
src/utils/regex.js                        + LIMITES / enumerados (y su gemelo en el frontend)
tests/clientes.test.js                    ← productos.test.js (usa tests/_api.js)
migraciones/NNN-….sql                     solo si cambias una tabla que ya existe
```

`services/productos.service.js` **no** se copia salvo que el recurso nuevo tenga una
regla usada desde dos sitios.

## 11. Extensiones (solo cuando se cumple su criterio)

- **Correo**: `src/mailer.js` con el único proveedor [O]. Al llegar el segundo
  proveedor externo (pagos, ficheros, OAuth), todos pasan a
  `src/integraciones/<proveedor>.js` (`mailer.js` → `integraciones/correo.js`). El
  resto del código llama a `enviarCorreoVerificacion(destino, datos)`, nunca a
  `nodemailer`.
- **Pagos**: el webhook se monta **antes** de `express.json()` con
  `express.raw()` (la firma se calcula sobre el cuerpo crudo) y es idempotente por
  id de evento.
- **Trabajos programados**: `src/jobs/<tarea>.job.js`, arrancados desde `server.js`.
- **Permisos por capacidades**: con más de tres roles, `autorizar("pedidos.borrar")`
  contra una tabla `rol → [capacidades]` en `utils/`.
