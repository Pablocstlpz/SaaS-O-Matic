# Decisiones del proyecto

Una entrada por cada decisión que se aparta del estándar de arquitectura o adopta
una de sus extensiones. Tres o cuatro líneas: el siguiente que lea el código tiene
que saber que fue a propósito y por qué, para no deshacerlo ni copiarlo donde no toca.

Las más recientes arriba.

---

## 2026-11-25 · `DivisasService` usa `shared/divisas.ts`

**Qué:** el servicio toma de `shared/divisas.ts` el tipo `Divisa`, los códigos y `EUR`. La skill solo deja a un servicio usar `BaseHttpService`, `interfaces` y `environments`.
**Por qué:** el servicio y la función que convierte tienen que hablar de la misma divisa, y `shared/` no depende de nada, así que no hay ciclo.
**Descartado:** repetir los tipos en el servicio, o llevarlos a `interfaces/`, que describe lo que devuelve nuestra API.

## 2026-11-25 · `BaseHttpService`: solo GET y POST, y errores sin la forma de la API

**Qué:** no hay `put`, `patch` ni `delete`. Si no llega un error con la forma de nuestra API (sin respuesta, o un cuerpo que no es suyo), `ErrorApi` lleva `tipo: ''` y `errors: []`.
**Por qué:** la API solo admite GET y POST, y así `ErrorApi` sigue sin campos opcionales.
**Descartado:** los cinco verbos y el `tipo?` de la plantilla. También inventar un `tipo` que el servidor no ha enviado.

## 2026-11-25 · `Id` es solo un número

**Qué:** `interfaces/id.ts` es `type Id = number`.
**Por qué:** la spec dice que los `id` son números y aquí solo hay SQLite.
**Descartado:** el `number | string` de la plantilla, que existe para MongoDB.

## 2026-11-25 · El pipe de importes convierte y suma

**Qué:** `pipes/importe.pipe.ts` recibe céntimos de euro (una línea o una lista) y la divisa. Convierte cada línea con `shared/divisas.ts`, suma y pinta. El nombre del fichero es el del plan.
**Por qué:** un total se pide con sus líneas, así que nunca se convierte el total en euros ni dos veces el mismo importe.
**Descartado:** un pipe que reciba importes ya convertidos, porque cada pantalla tendría que convertir antes. También el `-pipe.ts` de la skill.

## 2026-11-25 · Solo modo claro

**Qué:** `material-theme.scss` fija `color-scheme: light` y `theme-type: light`. La app no sigue el modo del sistema.
**Por qué:** así hay una sola paleta que ajustar y revisar, y la spec no pide modo oscuro.
**Descartado:** el `color-scheme: light dark` de la plantilla.

## 2026-11-25 · Fuente instalada con @fontsource, sin Google Fonts

**Qué:** la letra es Atkinson Hyperlegible Next (400, 500 y 700), del paquete `@fontsource/atkinson-hyperlegible-next`, que `angular.json` mete en el build. `index.html` no enlaza nada externo.
**Por qué:** la app no depende de un servicio de fuera para verse bien. Esta letra distingue `0/O` y `1/I/l` (identificadores fiscales) y tiene cifras tabulares para los importes.
**Descartado:** la Roboto de la plantilla y los enlaces a Google Fonts.

## 2026-11-25 · Botones con Tailwind y sin fuente de iconos

**Qué:** botones y enlaces se pintan con Tailwind, sin `mat-button`, `mat-icon` ni Material Icons. `styles.css` quita la paleta de Tailwind (`--color-*: initial`): solo quedan los colores del tema.
**Por qué:** los botones no están entre los controles de Material (ver «Material solo para controles»), y ninguna pantalla de la spec pide iconos.
**Descartado:** el `mat-button` y la fuente de iconos de la plantilla.

## 2026-11-25 · Sin SweetAlert2

**Qué:** no se instala `sweetalert2`. Los avisos serán solo el snackbar de Material.
**Por qué:** su uso en la skill es el diálogo de confirmación, y aquí no se edita ni se borra nada.
**Descartado:** dejar la dependencia instalada sin usarla.

## 2026-11-25 · Peticiones corruptas: 400, no 500

**Qué:** un cuerpo comprimido y corrupto da 400 `VALIDACION` con «No se puede leer el cuerpo de la petición», y una ruta mal codificada (`/customers/%`), «No se puede leer la dirección de la petición». `app.ts` traduce así cualquier otro error que Express marque con `status` 400.
**Por qué:** son fallos del cliente. Sustituye al pendiente de B1, que dejaba el cuerpo corrupto en 500.
**Descartado:** una lista cerrada de errores de `express.json()`, porque los de descompresión no traen `type`.

## 2026-11-25 · Topes de `q`, de los id y carácter nulo

**Qué:** `q` admite como mucho `NOMBRE_EMPRESA_MAX` (120) caracteres. Ni `q` ni `nombre_empresa` admiten el carácter nulo. `id` y `cliente_id` van de `-Number.MAX_SAFE_INTEGER` a `Number.MAX_SAFE_INTEGER` (`RANGO_ID`).
**Por qué:** la spec pide límite en todos los campos y algo más largo que un nombre no puede coincidir. SQLite corta el texto en el nulo, y un id de cientos de cifras llegaba como `Infinity` y daba 500.
**Descartado:** recortar `q` sin avisar o devolver una lista vacía. También quitar el nulo del texto.

## 2026-11-25 · Columna `nombre_busqueda`

**Qué:** el cliente guarda además el nombre en minúsculas (`paraBuscar`), que rellena el `set` de `nombre_empresa`. El buscador compara y ordena con ella, y no sale por la API.
**Por qué:** el `LIKE` de SQLite solo iguala mayúsculas inglesas, y `sqlite3` no permite registrar funciones propias. Su orden también es binario. Las tildes siguen contando: `erica` no encuentra «Ibérica», y en la lista «Ábaco» sale detrás de «Zeta».
**Descartado:** filtrar en Node (obliga a cargar todos los clientes) y compilar la extensión ICU. Una BD creada antes de este cambio hay que borrarla: `sync()` no añade columnas.

## 2026-11-25 · Buscador: `Op.like` con `ESCAPE` en un literal fijo

**Qué:** `GET /customers` compara con `literal(":patron ESCAPE :escape")` y pasa los dos valores por `replacements`. El patrón lleva una barra delante de `%`, `_` y la propia barra.
**Por qué:** SQLite no tiene carácter de escape por defecto y `Op.like` de Sequelize 6 no añade `ESCAPE`: sin él, `q=%` lo devuelve todo. El literal no contiene texto del usuario, que Sequelize escapa al sustituirlo.
**Descartado:** pegar el texto en el literal (SQL montado a mano) y `fn("like", …)`, que deja de encontrar textos como `$1`.

## 2026-11-25 · Parámetros de la consulta: misma regla que el cuerpo

**Qué:** todo parámetro de la consulta se declara con `campoDeLaConsulta` (`validators/_campo.ts`), no con `query()`: es opcional y no puede ser una lista (`?q=a&q=b` es 400 `VALIDACION`).
**Por qué:** es el mismo agujero que en el cuerpo: express-validator valida las listas elemento a elemento.
**Descartado:** quedarse con el primer valor o con el último sin avisar.

## 2026-11-25 · Patrón de los mensajes de cada campo

**Qué:** en todos los campos (cuerpo, ruta y consulta), de este bloque y de los siguientes, el mensaje es «<Campo> es obligatorio» si falta y «<Campo> debe ser <regla>» si está mal, concordando en género y número: «Los usuarios son obligatorios», «El país debe ser uno de: ES, FR, GB, IT, DE».
**Por qué:** la spec no fija textos. Con un solo patrón, todos los formularios avisan igual y no hay que decidir cada frase.
**Excepción:** el 409 `IDENTIFICADOR_REPETIDO` dice «Ya existe un cliente con ese identificador fiscal», en `message` y en `errors`.
**Descartado:** un texto libre para cada campo y regla.

## 2026-11-25 · Campos del cuerpo: regla común

**Qué:** todo campo del cuerpo se declara con `campoDelCuerpo` (`validators/_campo.ts`), no con `body()`: exige que venga y que no sea una lista ni un objeto, antes de cualquier sanitizer. Una lista o un objeto dan el «debe ser» de su campo.
**Por qué:** express-validator valida las listas elemento a elemento, así que `usuarios: []` daba un precio de 0 € en vez de rechazarse. La regla común evita repetir el fallo en cada recurso.
**Descartado:** el `body()` directo de la plantilla con la comprobación campo a campo, porque basta olvidarla en uno. También un texto propio para listas y objetos.

## 2026-11-25 · Cuerpos que la API no puede leer

**Qué:** un juego de caracteres o una compresión no admitidos dan 400 `VALIDACION` con «No se puede leer el cuerpo de la petición». Un cuerpo que no es JSON (otro `Content-Type`) no se lee: la petición sigue como si no trajera cuerpo, aunque pase de 100 KB, y no hay 413.
**Por qué:** lo primero es un fallo del cliente y no un 500. Lo segundo no llega a cargarse en memoria, que es lo que protege el límite, y el frontend solo envía JSON.
**Descartado:** el 500 de la plantilla para lo primero. Para lo segundo, rechazar otros `Content-Type` o contar sus bytes.

## 2026-11-25 · Configuración con valores por defecto, sin `.env`

**Qué:** `config.ts` lee `PORT` (3000), `FRONTEND_URL` (`http://localhost:4200`) y `DB_ALMACEN` (`backend/datos.sqlite`) de las variables de entorno, todas con valor por defecto. No hay `dotenv`, `.env.example` ni variables obligatorias. `validarConfig()` devuelve la lista de fallos y es `server.ts` quien la escribe y sale con 1. CORS admite solo `FRONTEND_URL`.
**Por qué:** sin autenticación ni servidor de base de datos no hay secretos, y la app arranca en local sin pasos previos. Así `config.ts` no depende de nada.
**Descartado:** el `.env` obligatorio de la plantilla. También su `localhost:4200` fijo en la lista de CORS además del configurado, porque la spec admite un solo origen.

## 2026-11-25 · Logger sin redacción de campos

**Qué:** `utils/logger.ts` escribe con `console.info`, `console.warn` y `console.error`, sin filtrar campos.
**Por qué:** los campos que redacta la plantilla (contraseñas y tokens) no existen aquí. `console.log` está prohibido en el proyecto.
**Descartado:** conservar la lista de campos sensibles, que no tendría nada que ocultar. Si entra algún secreto, se recupera de la plantilla.

## 2026-11-25 · Material solo para controles; el resto, con Tailwind

**Qué:** Angular Material se usa solo para controles: slider, select, campos de formulario, snackbar y spinner. Su tema se ajusta al diseño. Tarjetas, rejilla y tipografía se hacen con Tailwind, sin `mat-card`, y no hay CSS a mano para lo que Tailwind ya resuelve.
**Por qué:** el aspecto de tarjetas y textos depende del diseño, y con Tailwind se controla desde las clases sin pelearse con los estilos internos de Material. Los controles sí aprovechan de Material la accesibilidad y el comportamiento.
**Descartado:** `mat-card` y la tipografía de Material, porque obligarían a sobrescribir sus estilos para ajustarlos al diseño.

## 2026-11-25 · Límites de tamaño más estrictos

**Qué:** máximo 200 líneas por fichero y 40 por función, en backend y frontend.
**Por qué:** la skill pone el corte en ~300 líneas por controlador o componente. Aquí se quiere que cada pieza se pueda revisar entera de un vistazo.
**Descartado:** el umbral de ~300 de la skill. Es demasiado permisivo para una app de este tamaño.

## 2026-11-25 · Servicio de precios (extensión)

**Qué:** los tramos, el coste base, el impuesto y el total se calculan solo en `backend/src/services/precios.service.ts`.
**Por qué:** la misma fórmula la usan dos acciones (`POST /simulations/calcular` y `POST /simulations`), que es el criterio de la skill para crear un servicio (SKILL.md §4.5). Además, la spec exige una única fórmula.
**Descartado:** el cálculo dentro del controlador de simulaciones, porque acabaría copiado en las dos acciones. También el cálculo en el frontend: la spec lo prohíbe.

## 2026-11-25 · Sin fecha_actualizacion

**Qué:** los modelos llevan `createdAt: "fecha_creacion"` y `updatedAt: false`.
**Por qué:** la spec solo define la fecha de creación, y ni clientes ni simulaciones se editan.
**Descartado:** el `fecha_actualizacion` de la skill, que siempre valdría lo mismo que `fecha_creacion`.

## 2026-11-25 · Códigos HTTP: 413 y 403 CORS sí, 422 no

**Qué:** la API responde 400, 404, 409 y 500 (los de la spec), más 413 si el cuerpo pasa de 100 KB y 403 `CORS` si el origen no está permitido.
**Por qué:** la spec pide el límite de 100 KB y el CORS restringido, pero no les da código. Un identificador fiscal falso, un país fuera de la lista o un cliente que no existe son 400, como dice la spec.
**Descartado:** el 422 de la skill (regla de negocio sobre los propios datos), que la spec no contempla. También descartado devolver 400 para el cuerpo demasiado grande.

## 2026-11-25 · El error lleva siempre message, tipo y errors

**Qué:** toda respuesta de error es `{ message, tipo, errors: [{ campo, mensaje }] }` con las tres claves; `errors` es `[]` cuando el error no es de un campo.
**Por qué:** la spec dice «siempre la misma forma». Así `ErrorApi` no tiene campos opcionales. Valores de `tipo`: `VALIDACION` (400, campo mal, también un JSON mal formado), `REFERENCIA_INVALIDA` (400, la simulación apunta a un cliente que no existe), `NO_ENCONTRADO` (404, también una ruta desconocida), `IDENTIFICADOR_REPETIDO` (409, con `errors` apuntando a `identificador_fiscal`), `DUPLICADO` (409, el índice único frenó una carrera), `DEMASIADO_GRANDE` (413), `CORS` (403) y `ERROR_INTERNO` (500).
**Descartado:** la forma de la skill, donde `tipo` y `errors` son opcionales (un 404 sale como `{ message }`).

## 2026-11-25 · Solo castellano, sin ngx-translate

**Qué:** los textos van escritos en las plantillas, en castellano. Se quitan `@ngx-translate/*`, `idioma.service.ts`, `public/i18n/` y el botón ES/EN. `LOCALE_ID` sigue siendo `es-ES`.
**Por qué:** es una herramienta interna de un equipo comercial que trabaja en castellano, y la spec no pide otro idioma. Menos dependencias y menos ficheros por pantalla.
**Descartado:** mantener ngx-translate «por si acaso». Obliga a duplicar cada texto en dos JSON sin que nadie lo use.

## 2026-11-25 · La API de divisas usa HttpClient directamente

**Qué:** `frontend/src/app/services/divisas.service.ts` llama a `https://open.er-api.com/v6/latest/EUR` con `HttpClient`, sin `BaseHttpService`.
**Por qué:** `BaseHttpService` está hecho para nuestra API (URL base de `environment`, errores como `ErrorApi` con la forma de nuestro contrato). Una API externa no sigue ese contrato. Además, si falla, la app no muestra un error: sigue en euros y avisa.
**Descartado:** pasarla por `BaseHttpService`, porque obligaría a llenarlo de excepciones. También descartado pedirla desde el backend: la spec la sitúa en las pantallas y la conversión es solo para mostrar. La prohibición de `HttpClient` en los componentes sigue en pie: solo este servicio lo usa a pelo.

## 2026-11-25 · Clientes en tarjetas, no en tabla de Material

**Qué:** los resultados del buscador y el detalle del cliente se pintan como tarjetas hechas con Tailwind, en una rejilla responsive (sin `mat-card`; ver «Material solo para controles»). No hay `MatTable`, `MatSort`, `MatPaginator` ni `PaginadorTraducido`.
**Por qué:** la spec pide tarjetas. El buscador devuelve como mucho 50 resultados, ya ordenados por nombre en el servidor, así que no hacen falta orden ni paginación en el navegador.
**Descartado:** la tabla de Material del procedimiento de la skill (§6.12 y el checklist).

## 2026-11-25 · SQLite sin Docker ni migraciones .sql

**Qué:** la base de datos es un fichero SQLite (ruta en `config.ts`, ignorado por git). Al arrancar, `server.ts` llama a `sequelize.sync()`, sin `alter` ni `force`, y se crean las tablas que falten. Las pruebas usan SQLite en memoria. No hay `migraciones/`, `migraciones.js`, `Dockerfile` ni `docker-compose.yml`.
**Por qué:** la spec fija SQLite, la app se ejecuta en local y no hay datos de producción que conservar.
**Descartado:** MySQL con Docker y el mecanismo `migrar()` con ficheros `NNN-*.sql` de la plantilla. Si algún día hay datos que conservar, se recupera `migrar()` de la skill (backend-node.md §7).

## 2026-11-25 · Rutas sin prefijo /api

**Qué:** las rutas son las de la spec: `/customers`, `/customers/:id`, `/customers/:id/simulations`, `/simulations/calcular` y `/simulations`. La de salud es `GET /salud`. La `apiUrl` del frontend es `http://localhost:3000`, sin `/api`.
**Por qué:** la spec define el contrato con esas rutas. Por dentro, ficheros y funciones siguen en castellano (`clientes.route.ts`, `simulaciones.controller.ts`, `listarClientes`), y cada router se monta en su prefijo inglés en `app.ts`.
**Descartado:** el `/api/<recursos>` en castellano de la skill (§3), porque cambiaría el contrato de la spec.

## 2026-11-25 · Sin autenticación, roles ni organizaciones

**Qué:** no hay login, tokens, usuarios, organizaciones ni roles. Fuera `auth.*`, `usuario.model`, `organizacion.model`, `utils/acceso.js` (`asegurarPropietario`), `utils/seguridad.js`, `rateLimit.middleware`, los scripts `crear-admin`/`crear-usuario`, y en el frontend `guards/`, `auth.interceptor`, `SesionService` y la pantalla de login. Las pruebas no tienen casos 401, 403 ni «404 de otro propietario». La referencia `cliente_id` solo se comprueba por existencia.
**Por qué:** la spec deja fuera el login y los usuarios: es una herramienta interna y nadie lo ha pedido. Sin identidad no hay propietario que comprobar (SKILL.md §2).
**Descartado:** conservar el modelo multiinquilino con una sola organización, como sugiere la skill. Añade tokens, helpers y pruebas para un requisito que no existe.

## 2026-11-25 · Backend en TypeScript, con Vitest

**Qué:** el backend es TypeScript (`strict`, ESM con `module: NodeNext` e imports con extensión `.js`). Mantiene las capas, carpetas y nombres de la plantilla Node, cambiando `.js` por `.ts` (`clientes.controller.ts`, `cliente.model.ts`, `utils/regex.ts`…). Se compila con `tsc`, `tsx watch` en desarrollo y las pruebas van con **Vitest** (`vitest run`), contra la app real en un puerto libre y SQLite en memoria, como `tests/_api.js`.
**Por qué:** la spec fija TypeScript. Vitest ejecuta TypeScript sin configuración extra, es el mismo runner que el frontend (`ng test`) y `vi.spyOn` sustituye a `t.mock.method` para probar la carrera del índice único.
**Descartado:** `node --test` con `tsx` como cargador (son dos herramientas y los mocks resultan más incómodos), Jest (su configuración con ESM y TypeScript da problemas) y la plantilla en JavaScript con JSDoc (no cumple la spec).
