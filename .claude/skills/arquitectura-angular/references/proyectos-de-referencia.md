# Proyectos de referencia

**Esto es descriptivo, no son instrucciones.** Cuenta de dónde sale cada práctica
del estándar (las marcadas [O]) y qué se corrigió (las [R]). No copies nada de aquí
a un proyecto: lo que hay que hacer está en SKILL.md y en las otras referencias.
Sirve para dos cosas: entender por qué el estándar dice lo que dice y, si trabajas
en uno de estos proyectos, saber qué convenciones suyas se respetan (regla 2).

### castilfac (Angular + Node)

Aplicación SaaS de gestión multi-inquilino: Express 5 con Sequelize; Angular 21
standalone con Material, Tailwind y ngx-translate; Docker Compose con nginx.

| En el proyecto | En el estándar |
|---|---|
| `backend/src/{routes,middlewares,validators,controllers,models,data,utils}` | Igual (backend-node.md §1). |
| `config.js` con `validarConfig()` y salida 1 | Igual (calidad.md §1). |
| Helpers de inquilino (`assertEmpresaIdParam`, `assertOwnsRecurso`, `empresaIdEfectivo`) con 404 para recursos ajenos | `utils/acceso.js` (calidad.md §3). |
| `utils/regex.js` ↔ `shared/regex.ts` gemelos; `LIMITES` solo en backend | Gemelos, incluido `LIMITES` (SKILL.md «Compartido»). |
| `logger` con redacción, pero aún muchos `console.error` | Solo `logger` (calidad.md §5). |
| Errores `{ message, errors?, tipo? }` con `tipo` que el interceptor interpreta | Igual, formalizado (calidad.md §2, SKILL.md «Contrato»). |
| Sin capa de servicios; controladores de hasta ~640 líneas; la regla de suscripción repetida en middleware, login y guard | Capa de servicios por criterio (calidad.md §8). |
| Todos los routers montados en `/api` | Un prefijo por router (backend-node.md §4). |
| Verbos mezclados (`getX`/`addX`/`obtenerX`/`crearX`) | Un juego de verbos (backend-node.md §3). |
| Algunos routers sin validadores | Validación obligatoria en ids y escrituras (backend-node.md §4). |
| Lista vacía a veces 404 y a veces `200 []` | Siempre `200 []` (SKILL.md «Contrato»). |
| Sin pruebas reales | Mínimo de calidad.md §6. |
| `environment.development.ts` sin `fileReplacements` | Conectado (calidad.md §1). |
| Interfaces TS con nombres que no coinciden con la respuesta | Interfaz = respuesta (calidad.md §7). |
| Componentes por zona, `BaseHttpService`, interceptor funcional con renovación única, guards funcionales, signals, `@if/@for`, carga diferida | Igual (frontend.md §1, frontend.md §4). |

### castilfootball (Angular + .NET)

Aplicación de porras, ranking, noticias y chat por partido: ASP.NET Core (.NET 10)
con controladores, MongoDB, JWT, BCrypt, rate limiting, MailKit y Cloudinary;
Angular 21 standalone con Material, Bootstrap y SweetAlert2; pnpm, ESLint y Prettier.

| En el proyecto | En el estándar |
|---|---|
| `BackendCSharp/{Controllers,Models,Services,Data}` + `Program.cs` | Igual, más `Dtos/`, `Middlewares/`, `Utils/`, `Configuration/` (backend-dotnet.md §1). |
| `MongoDbService` singleton con `GetCollection<T>("porras")` repetido en cada controlador | `MongoContexto` con colecciones tipadas declaradas una vez (backend-dotnet.md §1). |
| CORS desde configuración, rate limiting por IP, JWT con validación de expiración, BCrypt, `user-secrets` | Igual (calidad.md §3, calidad.md §4). |
| Ficheros `*EndPoints.cs` con clases `*Controller` | Fichero = clase (backend-dotnet.md §3). |
| `Models/` mezcla entidades y lo que se recibe (`PorraSend`, `LoginRequest`) | `Models/` entidades, `Dtos/` entrada (backend-dotnet.md §1). |
| `if (!ModelState.IsValid)` a mano con `[ApiController]` | Lo hace `[ApiController]`; el formato del 400 se fija una vez (backend-dotnet.md §4). |
| Errores como `{ message }`, `{ error }`, `{ mensaje }`, texto o `ProblemDetails` | `{ message, tipo?, errors? }` (calidad.md §2). |
| `return Forbid("No puedes…")`: el texto es un esquema de autenticación y acaba en 500 | 404 para lo ajeno, `[Authorize(Roles)]` para el rol (calidad.md §2). |
| Configuración leída con `IConfiguration["…"]` y validada a mano en varios sitios | Opciones tipadas con `ValidateOnStart` (calidad.md §1). |
| Token generado dentro de `UsuariosController` (680 líneas) | `SeguridadService` (backend-dotnet.md §1). |
| Sin manejador global; un controlador devuelve `ex.Message` | `IExceptionHandler`, 500 genérico (calidad.md §2, calidad.md §5). |
| `IEmailService` + `EmailService` registrados en `Program.cs` | Igual para integraciones externas. |
| JSON camelCase | Proyectos nuevos en `snake_case` (SKILL.md «Contrato»); castilfootball sigue en camelCase. |
| 19 avisos de nulos al compilar; sin pruebas | Compilación sin avisos y pruebas xUnit (calidad.md §6, calidad.md §7). |
| Frontend: misma forma que castilfac (`components/` por zona, `services/`, `interfaces/`, `guards/`, `interceptors/`, `partes-html/`, `nopermitir/`) | Igual (frontend.md §1). |
| Frontend: sin `BaseHttpService` (cada servicio repite `handleError`), guard de clase, interceptor sin renovación de sesión, un solo `environments.ts` | `BaseHttpService`, guards funcionales, renovación única, dos `environment` (SKILL.md «Compartido», frontend.md §4, calidad.md §1). |
| Bootstrap para maquetar, Font Awesome instalado | Una sola librería de maquetación (frontend.md §2). |

### 2-DAW (ejercicios del curso)

Repositorio de clase, revisado en `Cliente/Javascript` y `Node`. Los ejercicios de un
solo tema (`UD7` sin framework, `ejercicioComponentes`, `repaso5`) no siguen
estructura y no cuentan. `Node/Node-Optativa/UD3` muestra cómo se fue armando la
estructura: rutas, controladores, validadores y `data/` (02–06); modelos, middleware
de JWT y `config.js` (06); `mailer.js` (07); todo junto en `Tarea-Proyecto-Node` y los
exámenes. En Angular, el más completo es `UD8/EXAMEN-ANGULAR` con su `Backend`.

| En el curso | En el estándar |
|---|---|
| Node: `src/{app.js,config.js,data,routes,controllers,validators,models,middlewares}`, ESM, express-validator, cada router en su prefijo `/api/…` | Igual (backend-node.md §1, backend-node.md §4). |
| Node: JWT de acceso y de refresco con secretos distintos, `autorizarRol([...])`, bcrypt | Igual (calidad.md §3). |
| Node: `mailer.js` en `src/` | Igual mientras haya un solo proveedor (backend-node.md §1, calidad.md §8). |
| Node: `conexionBD().then(listen)` y `process.exit(1)` si falla | Igual en `server.js` (calidad.md §4). |
| Node: respuestas `{ data: … }` | Sin envoltorio; si existe, se desenvuelve en `BaseHttpService` (SKILL.md «Contrato»). |
| Node: 400 de validación como `{ errors }` sin `message`; 500 con `error: error.message` | `{ message, errors }`; 500 sin detalle (calidad.md §2). |
| Node: sin token → 403 | 401, para que el interceptor renueve (calidad.md §2). |
| Node: a veces `routers/`, `*.routers.js` y `export default` | `routes/`, `*.route.js`, exportación con nombre (backend-node.md §3). |
| Node: refresco en cookie `httpOnly` (enseñado, comentado en el código) | El siguiente paso recomendado (calidad.md §3). |
| Angular: `components/` por pantalla con hijos dentro, `interfaces/`, `services/` con `environment`, `inject()`, `signal`, carga diferida, formularios reactivos, `LOCALE_ID` en español, snackbar | Igual (frontend.md §1). |
| Angular: `pipes/` (estrellas, euros, año) en 7 de 11 proyectos | `pipes/` con ejemplo y prueba (frontend.md §1). |
| Angular: padre + tarjeta hija con `input()`/`output()` | `productos` + `producto-acciones` (frontend.md §1). |
| Angular: `MatTable` + `MatSort` + `MatPaginator` en 7 proyectos | Tabla de Material en el listado (frontend.md §2). |
| Angular: servicios con `handleError` propio, tipados como lista pero leyendo `.data` con `any`; sin guards ni interceptor | `BaseHttpService`, tipos de verdad, guards e interceptor (SKILL.md «Compartido», calidad.md §7, frontend.md §4). |
| Angular: Bootstrap para maquetar, Font Awesome instalado y casi sin usar | Tailwind en proyectos nuevos (decidido); iconos de Material (frontend.md §2). |
