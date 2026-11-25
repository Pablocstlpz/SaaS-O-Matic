# Calidad, seguridad y evolución

Común a los tres backends y al frontend. Lo específico de cada uno está en
`backend-node.md`, `backend-dotnet.md`, `backend-python.md` y `frontend.md`.

Contenido: 1 Configuración y secretos · 2 Errores y códigos · 3 Autenticación y
autorización · 4 Superficie HTTP · 5 Logging · 6 Pruebas · 7 Tipado · 8 Evolución
de la arquitectura · 9 Evolución del contrato · 10 Decisiones escritas

---

## 1. Configuración y secretos

- Un único sitio lee el entorno (`config.js` / `Configuration/` / `config.py`) y **la API no
  arranca** si falta algo obligatorio, con un mensaje que dice qué falta y dónde
  ponerlo [O].
- Toda variable en `.env.example` (raíz, comentado por bloques); el `.env` real en
  `.gitignore` [O]. En Docker, `${VAR}` en `docker-compose.yml`, sin valores escritos.
- Secretos distintos para el token de acceso y el de refresco, generados con
  `openssl rand -hex 64`.
- Valores de negocio escritos en el código (cuentas especiales, precios, límites de
  plan) van a configuración [R].
- El frontend **no tiene secretos**: en `environment.ts` solo la URL de la API e
  identificadores públicos. `environment.development.ts` conectado con
  `fileReplacements` en `angular.json` [R]; sin eso, desarrollo apunta a producción
  o producción a localhost.

## 2. Errores y códigos

Forma única de toda respuesta de error [O]:

```json
{ "message": "Texto que se puede enseñar al usuario", "tipo": "CODIGO_ESTABLE", "errors": [{ "campo": "nombre", "mensaje": "…" }] }
```

`message` siempre, redactado en castellano para una persona; `tipo` cuando el
frontend tiene que **reaccionar** (redirigir, pintar junto a un campo);
`errors` solo en validación. No vale `{ error }`, `{ mensaje }`, texto plano ni el
`ProblemDetails` de ASP.NET: el frontend solo lee `message`.

| Código | Cuándo |
|---|---|
| 400 | Entrada mal formada (validación, JSON roto, id con formato imposible) o referencia a un recurso que no existe o es de otro propietario (`REFERENCIA_INVALIDA`). |
| 401 | Sin credencial o caducada (el interceptor intenta renovar una vez). |
| 403 | Autenticado pero sin permiso, o cuenta sin habilitar (`tipo` lo distingue). |
| 404 | No existe **o no es tuyo**: un recurso de otro propietario responde 404, no 403, para no confirmar que existe [O]. |
| 409 | Choca con el estado de **otro** dato o del propio recurso: duplicado (`NOMBRE_REPETIDO`, `DUPLICADO`), borrar algo en uso (`EN_USO`), una transición que el estado actual no permite (`ESTADO_INVALIDO`). |
| 422 | Bien formado pero viola una regla del negocio sobre **los propios datos**: fecha en el pasado, fuera del horario, menos antelación de la mínima. Con su `tipo` (`FECHA_PASADA`). |
| 429 | Rate limit, con `message` [O]. |
| 500 | Inesperado. Mensaje genérico; el detalle va al log, **nunca** a la respuesta [O]. |

Orden de las comprobaciones **dentro del controlador**: ¿existe para ti? (404) →
¿puedes hacer esto? (403) → ¿cumple las reglas? (409/422). El 400 de formato llega
antes, sin entrar en el controlador (validador o `[ApiController]`), y el 401/403 de
rol también (middleware o `[Authorize]`): no pasa nada, porque ninguno de los dos
dice si un id existe.

Los errores esperados se **lanzan** (`ErrorHttp(status, message, tipo)`) y un
manejador global los convierte en la respuesta; todo lo demás sale como 500. Así
los controladores no llevan `try/catch`. Si un proyecto existente usa
`try/catch` por controlador, se migra por controlador completo, no a medias. Ojo:
introducir el manejador global cambia la forma de **todos** los errores de la
API, también de controladores que no tocas: es un cambio transversal, se avisa y se
comprueba qué lee el frontend (ver `revision.md`).

## 3. Autenticación y autorización

- Token de acceso corto (≈15 min) + refresco largo (≈7 días) con **secreto
  distinto** [O]; renovar vuelve a cargar el usuario de la BD, para no prolongar un
  rol o una cuenta retirados. Revocar al momento exige guardar los refrescos
  emitidos [R].
- Claims mínimos: el usuario (`id` en Node, que se lee como `req.usuario.id`; `sub` en
  .NET, que se lee con `User.UsuarioId()`; `sub` como texto en Python, que se lee como
  `usuario.id`), `rol` y `organizacion_id` [O].
- Contraseñas con bcrypt, coste en una constante (12) [O]. Tokens de un solo uso
  (verificar correo, restablecer) se guardan **hasheados** y caducan.
- Rate limit específico en login, renovación, registro y recuperación [O]. Detrás de
  un proxy, la IP real (`trust proxy` / `UseForwardedHeaders` / `ip_cliente` en
  `dependencias/limite_peticiones.py`).
- Autorización en el backend **siempre**; los guards de Angular son navegación.
- Por rol mientras haya ≤ 3 roles; por capacidades al crecer (§8).
- Credenciales en `sessionStorage` [O]: aceptable para empezar, pero un XSS las lee.
  El siguiente paso es el refresco en cookie `httpOnly; Secure; SameSite=Strict` y
  el acceso en memoria [R].
- **Propietario** (ver SKILL.md): sale del token, el recurso se comprueba con el
  helper y **todo listado se pide ya filtrado**, nunca filtrando después. Las rutas
  no llevan el id de quien llama (`/api/porras`, no `/api/usuarios/:id/porras`): si
  un proyecto existente lo lleva, se compara con el token y, si no coincide, 404.

## 4. Superficie HTTP

- Cabeceras de seguridad: `helmet` en Node; en .NET, `nosniff`, `X-Frame-Options`,
  `Referrer-Policy` en `Program.cs`; en Python, las mismas de helmet en `main.py`.
- CORS con lista blanca desde configuración, sin barra final, nunca `*`.
- Límite de tamaño del cuerpo (`express.json({ limit })`; Kestrel trae uno; en Python,
  `LimiteCuerpo` en `main.py`).
- `GET /api/salud` → `{ estado: "ok" }`.
- La API **no escucha sin base de datos**: si no conecta, sale con código 1 y un
  mensaje. Una API que arranca sin BD responde 500 a todo y parece viva para Docker.
- Webhooks: cuerpo crudo para verificar la firma, idempotentes por id de evento.

## 5. Logging

- Un logger con nivel y contexto, con **redacción** de campos sensibles (Node y
  Python) o `ILogger<T>` (.NET). Nunca `console.log`/`Console.WriteLine`/`print` sueltos ni un DTO
  entero en el log.
- Detalle del error en el log, nunca en la respuesta.
- Al crecer: id de petición en cada línea, log estructurado a stdout, y medir el
  tiempo por ruta antes de añadir caché.

## 6. Pruebas

Mínimo, de más barato a más caro:

1. **Funciones puras** (cálculos, transiciones): `node --test`, xUnit, pytest o Vitest.
2. **API** con la aplicación real y una BD de usar y tirar. Por recurso: feliz, 400,
   401, 403 en cada acción que escribe, 404 de otro propietario, y 409 y referencia
   ajena cuando el recurso tiene esa regla o esa relación.
3. **Servicios Angular** con `HttpTestingController`.
4. **Componentes** con lógica: cargando, vacío, error, filtros, formularios.
5. **E2E** (Playwright) para los 3–5 recorridos que dan dinero.

En .NET, al deshacer la rotura, que el binario se vuelva a compilar: restaurar un
fichero con su fecha antigua (`cp -p`, `git stash`) puede dejar el ensamblado roto y
la prueba en verde por error. `dotnet test` sin `--no-build`, o `dotnet build
--no-incremental`, después de cada rotura y de cada arreglo.

**Técnica obligatoria: rompe para comprobar.** Una prueba nueva solo cuenta si se
pone roja al quitar lo que protege. Quita el filtro por organización, el índice
único, el `[Authorize]`, la validación…; ejecuta; tiene que fallar; deshaz. Si no
falla, la prueba está mal.

Las pruebas de sesión viven en su propio fichero (`auth.test.js` / `AuthTests.cs` /
`test_auth.py`) y los helpers comunes en `tests/_api.js` / `ApiDePrueba.cs` /
`tests/conftest.py`: así se borra un recurso de ejemplo sin perderlas.

## 7. Tipado

- `strict` y `strictTemplates` en Angular. Prohibido `any` (y `$any()`) en código
  nuevo.
- .NET con `Nullable` y **sin avisos** al compilar: cada aviso de nulos es un
  `NullReferenceException` posible.
- Las interfaces TS describen **lo que devuelve la API**, campo a campo y con el
  mismo nombre. Opcionales con `?`, y `| null` si llega `null`.

## 8. Evolución de la arquitectura

Escalar no es crear carpetas. Antes de añadir una capa, identifica **qué** crece:

| Crece… | Síntoma | Respuesta proporcionada |
|---|---|---|
| El código de un módulo | Controlador > ~300 líneas, funciones > ~60, lógica repetida | Servicio de dominio para ese recurso. |
| El número de módulos | `services/` o `components/<zona>` > ~15 entradas | Carpetas por funcionalidad (frontend §14). |
| Las listas | Respuestas de MB, pantallas lentas | Filtros y paginación en el servidor como parámetros opcionales. |
| El tráfico | CPU de la API alta | Varias instancias tras el proxy (la API ya es sin estado); rate limit en almacén compartido. |
| Lecturas repetidas | La misma respuesta cara muchas veces | Cabeceras HTTP de caché; después caché con invalidación explícita. |
| Trabajo lento en la petición | Correos, PDFs, terceros alargan la respuesta | Trabajo en segundo plano. |
| El equipo | Conflictos constantes en los mismos ficheros | Carpetas por funcionalidad y dueños por carpeta; no microservicios. |

Criterios objetivos de cada extensión:

- **Servicios de dominio**: una regla usada desde **dos sitios** —dos acciones,
  aunque sean del mismo controlador; dos controladores; un controlador y un
  middleware; un controlador y un trabajo—, un controlador de más de ~300 líneas o
  una operación que coordina varias entidades. Ejemplo: «¿la cuenta está
  habilitada?» copiado en un middleware, en el login y en un guard →
  `cuentas.service.js` / `CuentasService.cs`. Recibe datos (no la petición) y
  devuelve datos o lanza `ErrorHttp`. Sin interfaz mientras haya una implementación.
- **Integraciones**: con el primer proveedor externo; el resto del código llama a
  funciones del dominio (`enviarCorreoVerificacion`), no a la librería.
- **Permisos por capacidades**: más de tres roles, o la misma lista de roles en más
  de cinco rutas.
- **Estado compartido en Angular**: dos pantallas no anidadas necesitan el mismo
  dato vivo → servicio con signals.
- **Trabajos en segundo plano**: tarea > ~1 s o que debe reintentarse. Primero en el
  proceso; una cola persistente con varias instancias.
- **Ficheros subidos**: nunca en el disco del contenedor. Volumen montado; después
  almacenamiento de objetos.
- **Caché**: solo con una medición que la justifique y una regla de invalidación.
- **Patrones complejos** (repositorio genérico sobre el ORM, CQRS, MediatR, event
  sourcing, microservicios): no por defecto; solo con un requisito concreto escrito
  en `docs/decisiones.md`.

Cómo ampliar sin romper: la extensión entra **por funcionalidad completa** (el
recurso que pasa a servicios pasa entero; los demás siguen igual hasta que les
toque); nada se mueve de carpeta sin una razón de esta tabla; cada extensión
adoptada se anota en `docs/decisiones.md`.

## 9. Evolución del contrato de API

- Añadir campos opcionales a la respuesta y parámetros opcionales a la entrada:
  siempre permitido.
- Quitar o renombrar un campo, cambiar su tipo o significado, cambiar un array por
  un objeto, cambiar la forma de los errores o los códigos: **incompatible**. Con un
  único frontend que se despliega a la vez, se cambian los dos en el mismo commit.
  Con clientes que no se actualizan a la vez (apps, integraciones), endpoint nuevo o
  `/api/v2/…`, y el viejo vive hasta que nadie lo use.
- Un endpoint heredado que se conserva por compatibilidad lleva un comentario que
  dice quién lo usa.

## 10. Decisiones escritas

`docs/decisiones.md` (la plantilla trae el modelo) guarda una entrada por decisión
que se aparta del estándar o adopta una extensión: fecha, qué, por qué y qué se
descartó. Tres o cuatro líneas. Sirve para que el siguiente agente no tome una
decisión por un experimento ni la deshaga.
