# Proyecto nuevo desde la plantilla

La plantilla es un proyecto que ya funciona (login, permisos, un recurso
`productos` completo, pruebas). Un proyecto nuevo **no se escribe desde cero**: se
copia, se adapta y se sustituye `productos` por los recursos del dominio. Escribir
tu propia estructura, aunque funcione, es justo lo que esta skill existe para
evitar.

Contenido: 1 Camino rápido · 2 Paso a paso · 3 Decidir el propietario · 4 Qué no se
copia a ciegas · 5 Quitar `productos` · 6 Base de datos y despliegue

---

## 1. Camino rápido

1. Copia `plantilla/frontend/` + **uno** de `plantilla/backend-node/`,
   `plantilla/backend-dotnet/` o `plantilla/backend-python/` + `plantilla/docs/`
   (§2.1). Si no te han dicho qué backend, pregúntalo antes de copiar nada.
2. Renombra el proyecto (§2.2).
3. Decide quién es el **propietario** de los datos y los **roles** (§3). Anótalo en
   `docs/decisiones.md`.
4. Antes de escribir código, la **tabla de endpoints** de cada recurso: método,
   ruta, quién puede, cuerpo, respuesta, errores con su `tipo`.
5. Por cada recurso del dominio, copia `productos` (Node: `backend-node.md` §10;
   .NET: `backend-dotnet.md` §12; Python: `backend-python.md` §11; frontend:
   `frontend.md` §13). Relaciones entre recursos: §5 de `backend-node.md`, §8 de
   `backend-dotnet.md` o §6 de `backend-python.md`, y §5 de `frontend.md`.
6. Quita `productos` (§5) cuando el primer recurso real funcione.
7. Verifica: pruebas del backend en verde, `npx ng build` sin avisos, `ng test` en
   verde, y repasa el checklist de SKILL.md.

## 2. Paso a paso

### 2.1 Copiar

```bash
S=<ruta de la skill>      # p. ej. ~/.claude/skills/arquitectura-angular
P=<proyecto>
mkdir -p $P
cp -r $S/plantilla/frontend        $P/frontend
cp -r $S/plantilla/backend-node/.  $P/      # backend/, .env.example, docker-compose.yml, .gitignore
#  o bien
cp -r $S/plantilla/backend-dotnet/. $P/
#  o bien
cp -r $S/plantilla/backend-python/. $P/
cp -r $S/plantilla/docs            $P/docs  # decisiones.md
```

El `/.` copia también los ficheros ocultos (`.env.example`, `.gitignore`). No copies
`node_modules/`, `bin/`, `obj/`, `.venv/` ni `__pycache__/` si existen.

### 2.2 Nombrar

- `name` en `frontend/package.json` (y en `backend/package.json` con Node).
- .NET: `Proyecto` → el nombre real en `Proyecto.slnx`, los dos `.csproj`
  (renómbralos), todos los `namespace Proyecto.Api…` y `using`, y `UserSecretsId`.
  Después `dotnet build` sin avisos.
- .NET, además: el `Dockerfile` (`Proyecto.Api.csproj` y `Proyecto.Api.dll`), el
  `ProjectReference` de `Api.Tests/*.csproj` y `Mongo:BaseDatos` en `appsettings.json`.
  Si el `Dockerfile` se queda con el nombre viejo, ninguna prueba lo detecta y la
  imagen no se construye. Además, el valor por defecto `BaseDatos = "proyecto"` de
  `Configuration/Opciones.cs` y `MONGO_BASE_DATOS` del `.env.example` de la raíz. Al
  terminar, `grep -rni proyecto backend/ .env.example docker-compose.yml` vacío.
- Node, además: `DB_NOMBRE` y `DB_USUARIO` en `.env.example`.
- Python: `name` en `backend/pyproject.toml` (y después `uv lock && uv sync`: sin el
  `sync`, el entorno se queda sin los comandos `crear-admin` y `crear-usuario`), `title` de
  `FastAPI(...)` en `app/main.py` y el usuario y la BD de `BD_URL` en `.env.example`.
- `<title>` de `frontend/src/index.html`, la clave del nombre de la aplicación en
  `public/i18n/*.json` y `apiUrl` de `environment.ts` con el dominio real.

### 2.3 Configuración

- Node: `cp .env.example backend/.env` y rellenar.
- .NET: desde `backend/Api`, `dotnet user-secrets set "Jwt:Secreto" "…"` y
  `"Jwt:SecretoRefresco"`; la conexión local en `appsettings.Development.json`.
- Python: `cp .env.example backend/.env` y rellenar; para desarrollar sin MySQL,
  `BD_URL=sqlite:///./datos.sqlite`. Los secretos tienen que tener 32 caracteres o más.
- Secretos con `openssl rand -hex 64`, distintos entre sí.

### 2.4 Arrancar

```bash
# Node
cd backend && npm ci && npm test && npm run crear-admin -- "Mi empresa" yo@correo.com 'Contraseña1!' && npm run dev
# .NET (sin internet: MONGO_BIN=<carpeta bin de un mongod> dotnet test)
cd backend && dotnet test && dotnet run --project Api -- crear-admin "Mi empresa" yo@correo.com 'Contraseña1!' && dotnet run --project Api
# Python (uv: https://docs.astral.sh/uv/)
cd backend && uv sync --frozen && uv run pytest -q && uv run crear-admin "Mi empresa" yo@correo.com 'Contraseña1!' && uv run python -m app.servidor
# Frontend
cd frontend && npm ci && CI=1 npx ng test --watch=false && npm start     # http://localhost:4200
```

Los tres backends escuchan en `http://localhost:3000` (Python, con la documentación
interactiva en `http://localhost:3000/api/docs` fuera de producción). El `package-lock.json` viene
incluido: `npm ci` instala las versiones probadas con npm 10 u 11. Para **cambiar**
dependencias usa npm 11 (`npx -y npm@11 install …`): con npm 10 la resolución de
Angular 21 puede fallar con `Cannot read properties of null (reading 'edgesOut')`.
El aviso de npm 11 sobre los `install-scripts` de `bcrypt` y `sqlite3` no impide
nada.

**Otros puertos** (si el 3000 o el 4200 están ocupados; compruébalo antes con
`curl -s localhost:3000/api/salud` (si responde, el puerto está cogido), porque otro proceso escuchando ahí
recibiría tus peticiones sin que te des cuenta): la API con `PORT` en
`backend/.env` (Node y Python) o `--urls http://localhost:<p>` (.NET); el frontend con
`npx ng serve --port <p>`; `apiUrl` de `environment.development.ts` con el puerto de
la API, y el origen del frontend en la lista blanca de CORS (`FRONTEND_URL` en Node y
Python, `Cors:Origenes` en .NET). Si falta lo último, el navegador bloquea todas las
peticiones con un error de CORS y la pantalla dice «No se puede conectar con el
servidor».

## 3. Decidir el propietario

Son dos decisiones distintas; las dos se escriben en `docs/decisiones.md`.

### 3.1 ¿Una empresa o varias en la misma instalación?

La plantilla es multi-inquilino: cada usuario pertenece a una **organización** y
todo se filtra por `organizacion_id`. Con **una sola empresa** (un gimnasio, un
club, una academia) **deja la organización tal cual**: tendrá una fila, que crea
`crear-admin "Nombre del club" …`. No cuesta nada, el aislamiento ya está probado y
el día que llegue un segundo cliente no hay que reescribir nada. Quitarla toca unos
diez ficheros por backend (§3.3) y no aporta funcionalidad: hazlo solo si hay una
razón escrita.

### 3.2 ¿De quién es cada recurso?

Dentro de la organización, cada recurso es de uno de estos dos tipos:

| Caso | Ejemplo | Qué se hace |
|---|---|---|
| **De la organización** (lo que trae la plantilla) | Clases, pistas, productos, tarifas: todos los de la empresa los ven | `organizacion_id` del token y `asegurarPropietario`; quién escribe lo decide el **rol**. Pruebas: 404 de otra organización y 403 de un rol sin permiso. |
| **De un usuario** | Reservas, porras, pedidos: cada uno ve lo suyo y el admin todo | Además de `organizacion_id`, `usuario_id` sacado del token; un helper que deja pasar al dueño y al admin (abajo). Pruebas: 404 al leer, cambiar o borrar lo de otro usuario, y el admin ve los de todos. |

Node (`utils/acceso.js`, junto a `asegurarPropietario`):

```js
const esAdmin = (req) => req.usuario.rol === "admin";

//filtro de los listados: el admin ve todo lo de su organización; el resto, solo lo suyo
export const filtroDeDueno = (req) => ({
  organizacion_id: organizacionDe(req),
  ...(!esAdmin(req) && { usuario_id: req.usuario.id }),
});

//lo de otro usuario responde 404, igual que lo de otra organización
export const asegurarDueno = (req, recurso) => {
  asegurarPropietario(req, recurso);
  if (!esAdmin(req) && recurso.usuario_id !== req.usuario.id) throw noEncontrado();
  return recurso;
};
// listar: Reserva.findAll({ where: filtroDeDueno(req) })
// crear:  usuario_id = req.usuario.id   (nunca del cuerpo)
```

.NET (`Utils/Acceso.cs`: la interfaz junto a `IDeOrganizacion` y el método **dentro** de
`public static class Acceso`, porque es un método de extensión):

```csharp
public interface IDeUsuario { string UsuarioId { get; } }

public static T AsegurarDueno<T>(this ClaimsPrincipal usuario, T? recurso)
    where T : class, IDeOrganizacion, IDeUsuario
{
    var r = usuario.AsegurarPropietario(recurso);
    if (!usuario.IsInRole(Roles.Admin) && r.UsuarioId != usuario.UsuarioId()) throw ErrorHttp.NoEncontrado();
    return r;
}
// listar: filtro por OrganizacionId y, si no es admin, también por UsuarioId == User.UsuarioId()
```

Python (`app/utils/acceso.py`):

```python
def asegurar_dueno(usuario, recurso):
    asegurar_propietario(usuario, recurso)
    if usuario.rol != "admin" and recurso.usuario_id != usuario.id:
        raise no_encontrado()
    return recurso
# listar: where(Pedido.organizacion_id == organizacion_de(usuario)) y, si no es admin,
#         .where(Pedido.usuario_id == usuario.id)
# crear:  Pedido(usuario_id=usuario.id, …)   (nunca del cuerpo)
```

Si el admin puede crear **para** otro usuario, ese `usuario_id` sí llega en el
cuerpo y se comprueba como cualquier referencia (existe y es de la misma
organización; si no, 400 `REFERENCIA_INVALIDA`). En los dos casos la identidad sale
**del token**, nunca del cuerpo ni de la URL, y un proyecto mezcla los dos tipos sin
problema (pistas de la organización, reservas de cada alumno).

Roles: cambia `admin`/`usuario` por los del proyecto (`admin`/`alumno`) en:

- backend: el fichero de límites (`ROLES` en `utils/regex.js` / `Roles` en
  `Utils/Limites.cs` / `ROLES` en `app/utils/limites.py`), el modelo de usuario, las
  rutas (`autorizar("admin")`) o `[Authorize(Roles)]`, los scripts de `package.json`
  (`crear-admin`/`crear-usuario` pasan el rol), el `crear-usuario` de `Program.cs` o
  las funciones de `scripts/crear_usuario.py`, y la siembra de las pruebas
  (`tests/_api.js`, `tests/auth.test.js` / `ApiDePrueba.cs` / `tests/conftest.py`);
- Python, además: el `default="usuario"` de `models/usuario.py`, el nombre del script
  en `[project.scripts]` de `pyproject.toml`, la aserción de rol de `tests/test_auth.py`
  y **una migración escrita a mano**: `rol` es un `Enum` en la BD y `--autogenerate`
  no detecta el cambio de sus valores (ni escribe bien el `downgrade`). La migración
  amplía el enum con los valores nuevos, hace `UPDATE` de las filas con el rol viejo y
  después quita los valores viejos;
- frontend: `ROLES` en `shared/regex.ts` (el tipo `Rol` de `interfaces/usuario.ts`
  sale de ahí), `esAdmin` en `services/sesion.service.ts`, los `rolGuard('admin')` de
  `app.routes.ts` y los textos del rol en `public/i18n/*.json`.

### 3.3 Quitar la organización (solo si se decidió en 3.1)

Ficheros que la nombran; después, `grep -rni organizacion backend/ frontend/src`
no debe encontrar nada salvo en las migraciones ya escritas (`backend/migraciones/`
de Python y Node: la historia no se edita, se añade una migración nueva):

- **Node**: `models/organizacion.model.js` (se borra), `models/associations.js`,
  `models/usuario.model.js`, `utils/seguridad.js` (el claim del token),
  `middlewares/auth.middleware.js`, `utils/acceso.js` (se queda solo lo del dueño o
  se borra), `scripts/crear-usuario.js` (sin argumento de organización),
  `tests/_api.js` (la siembra de la «otra» organización), `tests/migraciones.test.js`
  (comprueba que existe la tabla `organizaciones`) y cada recurso (modelo,
  controlador, servicio y su prueba de 404).
- **.NET**: `Models/Organizacion.cs` (se borra), `Models/Usuario.cs`,
  `Data/MongoContexto.cs` (colección e índices), `Utils/Acceso.cs` (`IDeOrganizacion`,
  el claim), `Services/SeguridadService.cs`, `Middlewares/Autenticacion.cs`,
  `Program.cs` y `Scripts/CrearUsuario.cs` (argumentos de `crear-admin`),
  `Api.Tests/ApiDePrueba.cs`, `Api.Tests/AuthTests.cs` (comprueba
  `usuario.organizacion_id`) y cada recurso.
- **Python**: `app/models/organizacion.py` (se borra) y su import en
  `app/models/__init__.py`, `models/usuario.py`, `utils/seguridad.py` (el claim),
  `dependencias/auth.py` (`UsuarioSesion`), `utils/acceso.py`, `schemas/auth.py`,
  `scripts/crear_usuario.py`, `tests/conftest.py`, `tests/test_auth.py`,
  `tests/test_migraciones.py` (comprueba la tabla `organizaciones`), cada recurso, y
  una migración (`uv run alembic revision --autogenerate`) que quite la tabla y la columna.
- **Frontend**: `interfaces/usuario.ts`, las interfaces de los recursos y los datos de
  prueba de los `.spec.ts` (`productos.spec.ts` lleva `organizacion_id`).

Las pruebas «404 de otra organización» se sustituyen por «403 de un rol sin
permiso» (recursos comunes) o «404 de otro usuario» (recursos de un usuario).

## 4. Qué no se copia a ciegas

- **El servicio de dominio** (`productos.service.js` / `ProductosService.cs` /
  `services/productos.py`): solo si el recurso nuevo tiene una regla usada desde dos sitios.
- **Los colores de marca**: se cambian las paletas de `material-theme.scss`, no las
  clases de los componentes.
- **El segundo idioma**: se puede dejar ngx-translate o quitarlo (`frontend.md` §7).
- **El motor de base de datos**: Node trae Sequelize (MySQL/MariaDB), .NET trae
  MongoDB porque es lo que usaban los proyectos de referencia, y Python trae SQLAlchemy
  (MySQL/MariaDB, también PostgreSQL). Otro motor es otra
  capa de datos y otros modelos; controladores, servicios y contrato no cambian.
- **La estructura del recurso**: copiar `productos` es copiar su forma (capas,
  validación, aislamiento, pruebas), no sus campos.

## 5. Quitar `productos`

Cuando el primer recurso real funcione, se borra entero; sin dejar restos que el
siguiente agente tome por algo vivo:

- **Node**: `models/producto.model.js` y sus líneas de `associations.js`,
  `validators/productos.validator.js`, `controllers/productos.controller.js`,
  `routes/productos.route.js` y su `app.use`, `services/productos.service.js`, sus
  constantes en `utils/regex.js`, `tests/productos.test.js`.
- **.NET**: `Models/Producto.cs`, `Productos` y su índice en `MongoContexto`,
  `Dtos/ProductoDtos.cs`, `Controllers/ProductosController.cs`,
  `Services/ProductosService.cs` y su registro en `Program.cs`, sus constantes en
  `Utils/Limites.cs`, `Api.Tests/ProductosTests.cs`.
- **Python**: `app/models/producto.py` y su import en `models/__init__.py`,
  `schemas/producto.py`, `routes/productos.py` y su `include_router` en `main.py`,
  `services/productos.py`, sus constantes en `utils/limites.py`,
  `tests/test_productos.py`, y la migración que borra la tabla:
  `uv run alembic revision --autogenerate -m "quitar productos" --rev-id 0002` sobre una
  BD al día (`uv run alembic upgrade head` antes).
- **Frontend**: `interfaces/producto.ts`, `services/productos.service.ts` y su spec,
  `components/panel/productos/` entero, sus rutas en `app.routes.ts` (y el
  `redirectTo: 'productos'` del panel → el primer recurso real), el enlace de
  `panel-layout.html`, la sección `productos` y la clave `panel.menu.productos` de
  `public/i18n/*.json` y sus constantes en `shared/regex.ts`.

Las pruebas de sesión (`tests/auth.test.js` / `Api.Tests/AuthTests.cs` /
`tests/test_auth.py`), las de migraciones (`tests/migraciones.test.js` /
`tests/test_migraciones.py`) y los helpers (`tests/_api.js` / `ApiDePrueba.cs` /
`tests/conftest.py`), las comunes de Python (`tests/test_comun.py` y
`app/schemas/comun.py`) **se quedan**. Después:

```bash
grep -rni producto backend/ frontend/src frontend/public \
  --exclude-dir={node_modules,bin,obj,.venv,__pycache__,.pytest_cache,.ruff_cache,versions} \
  --exclude='*.sqlite'
```

no debe encontrar nada. `versions` queda fuera porque las migraciones de Python ya
escritas (la que creó la tabla y la que la borra) la nombran, y no se editan.

## 6. Base de datos y despliegue

- Node crea las tablas al arrancar y aplica `backend/migraciones/*.sql`
  (`backend-node.md` §7). .NET crea los índices al arrancar. Python aplica
  `alembic upgrade head` al arrancar (`backend-python.md` §8).
- `cp .env.example .env`, rellenar y `docker compose up -d --build`. La base de
  datos **no** viene en el compose: se añade su servicio o se apunta la conexión a
  una existente.
- Para tener la skill en todos los proyectos sin copiarla a cada repositorio, la
  carpeta entera (con `plantilla/`) va en `~/.claude/skills/arquitectura-angular/`.
