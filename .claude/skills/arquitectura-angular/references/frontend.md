# Frontend (Angular 21 standalone)

El mismo frontend sirve para los tres backends. Léelo entero antes de tocar
pantallas. El código de ejemplo de cada carpeta está en `plantilla/frontend/`.

Contenido: 1 Árbol · 2 Librerías y estilos · 3 Nombres · 4 Cada pieza · 5 Formularios
· 6 Listados con tabla de Material · 7 Textos e idioma · 8 Fechas y horas · 9 Avisos
· 10 Suscripciones · 11 Pruebas · 12 Formato del código · 13 Copiar `productos` ·
14 Crecer a carpetas por funcionalidad

---

## 1. Árbol

```
frontend/
├── package.json  package-lock.json  tsconfig*.json
├── angular.json             fileReplacements: `ng serve` usa environment.development.ts
├── .prettierrc.json         formato del código (npm run formato)
├── .postcssrc.json          activa Tailwind 4 en el build de Angular
├── Dockerfile  nginx.conf  .dockerignore     build con node → servir con nginx (fallback a index.html)
├── public/i18n/es.json  en.json              textos de la interfaz por clave
└── src/
    ├── index.html                            fuentes Roboto y Material Icons
    ├── material-theme.scss                   tema de Material: ÚNICA fuente de colores (claro/oscuro)
    ├── styles.css                            Tailwind + sus colores sacados del tema
    ├── environments/
    │   ├── environment.ts                    producción: apiUrl (nunca secretos)
    │   └── environment.development.ts        http://localhost:3000/api (Node, .NET o Python)
    └── app/
        ├── app.ts  app.html                  raíz: solo <router-outlet />
        ├── app.config.ts                     router, HttpClient + interceptor, es-ES, traducciones
        ├── app.routes.ts                     todo con loadComponent; zonas con layout e hijas
        ├── guards/
        │   ├── auth.guard.ts                 sin sesión → /login?volver=…
        │   └── rol.guard.ts                  rolGuard('admin')
        ├── interceptors/auth.interceptor.ts  Bearer + una sola renovación ante varios 401
        ├── services/
        │   ├── base-http.service.ts          verbos tipados + ErrorApi(status, message, tipo)
        │   ├── sesion.service.ts             estado compartido con signals (patrón de cualquier store)
        │   ├── notificaciones.service.ts     ÚNICA puerta a avisos: snackbar y SweetAlert2
        │   ├── idioma.service.ts             idioma activo, recordado entre visitas
        │   ├── paginador-traducido.service.ts  textos del paginador en el idioma activo
        │   ├── productos.service.ts          un método por endpoint
        │   └── productos.service.spec.ts     prueba de servicio con HttpTestingController
        ├── interfaces/
        │   ├── id.ts                         Id = number | string (SQL da números, Mongo texto)
        │   ├── producto.ts                   lo que devuelve la API + lo que se envía
        │   └── usuario.ts
        ├── pipes/
        │   ├── tiempo-relativo-pipe.ts       «hace 3 días»: transforma para mostrar
        │   └── tiempo-relativo-pipe.spec.ts  prueba de función pura, sin TestBed
        ├── shared/regex.ts                   gemelo de utils/regex.js (Node), Utils/Limites.cs (.NET) o app/utils/limites.py (Python)
        └── components/
            ├── compartidos/cargando/         pieza de UI: solo input(), sin servicios
            ├── publico/                      zona sin sesión: login/, no-encontrado/
            └── panel/                        zona con sesión (una carpeta por zona)
                ├── panel-layout/             cabecera + menú + <router-outlet>; provee el paginador traducido
                └── productos/                el PADRE: tabla, signals, cargando/vacío/error
                    ├── productos.spec.ts     prueba de componente (TestBed + HttpTestingController)
                    ├── producto-acciones/    el HIJO: input() producto, output() editar / eliminar
                    └── producto-formulario/  crear y editar en la misma pantalla (:id como input)
```

Cada componente es una carpeta con `nombre.ts`, `nombre.html`, `nombre.css`, sin
sufijo `.component` (estilo Angular ≥ 20) [O]. Clase = nombre en PascalCase:
`cliente-formulario/` → `ClienteFormulario`.

Dependencias permitidas: `components → services, interfaces, shared, pipes,
components/compartidos` · `services → BaseHttpService, interfaces, environments` ·
`guards/interceptors → services` · `interfaces → shared` (solo para derivar tipos de
constantes, p. ej. `type Estado = (typeof ESTADOS)[number]`) · `shared → nada`.
Ningún componente importa `HttpClient`.

## 2. Librerías y estilos

| Paquete | Para qué | Dónde |
|---|---|---|
| `@angular/material` + `@angular/cdk` | Campos, botones, selects, iconos, spinner, snackbar, `MatTable` + `MatSort` + `MatPaginator`; tema de colores | Cada componente importa solo sus módulos |
| `@angular/forms` | Formularios reactivos y `Validators` | Formularios, con los `LIMITES` de `shared/regex.ts` |
| `tailwindcss` 4 + `@tailwindcss/postcss` | Maquetación con clases | `.html`; colores en `styles.css` |
| `@ngx-translate/core` + `http-loader` | Textos en varios idiomas | `{{ 'clave' \| translate }}`; `public/i18n/` |
| `sweetalert2` | Diálogos de confirmación | Solo en `notificaciones.service.ts` |
| `rxjs` | Peticiones y flujos | Servicios |
| `vitest` + `jsdom` (dev) | Pruebas (`ng test`) | `*.spec.ts` |
| `prettier` (dev) | Formato | `npm run formato` |

- **Material** para controles; **Tailwind** para colocar; el `.css` del componente
  solo para lo que no se puede hacer con clases.
- Colores **siempre** con los nombres del tema (`bg-superficie`, `text-suave`,
  `text-peligro`), nunca `bg-blue-600`: la marca y el modo oscuro se cambian en
  `material-theme.scss` y todo lo demás los sigue.
- Una librería por función. No se añade Bootstrap (maquetación), Font Awesome
  (iconos: los de Material), Flowbite (duplica Material) ni otra de avisos. Tailwind
  es la decisión para proyectos nuevos; un proyecto que ya usa Bootstrap sigue con
  Bootstrap y no se le añade Tailwind encima.
- Opcional: `jspdf` + `jspdf-autotable` en `services/pdf.service.ts` si hay PDFs;
  `angular-eslint` si el proyecto quiere lint.

## 3. Nombres

| Pieza | Convención | Ejemplo |
|---|---|---|
| Carpetas | kebab-case [O] | `detalle-cliente/` |
| Servicio | `<recursos>.service.ts` + `XService` | `clientes.service.ts` · `ClientesService` |
| Métodos del servicio | `listar` · `obtener` · `crear` · `actualizar` · `eliminar` | |
| Interfaz | singular, sin prefijo `I`; campos idénticos al JSON (snake_case) [O] | `interfaces/cliente.ts` → `Cliente` y `DatosCliente` (lo que se envía, como `DatosProducto`) |
| Signals | sustantivo; booleanos como estado [O] | `clientes`, `cargando`, `busqueda` |
| Inputs / outputs | sustantivo / verbo de lo que pasó o se pide | `cliente = input.required<Cliente>()`, `eliminar = output<Cliente>()` |
| Pipe | `<nombre>-pipe.ts`, clase `<Nombre>Pipe`, nombre camelCase | `tiempo-relativo-pipe.ts` · `tiempoRelativo` |
| Claves i18n | `<seccion>.<clave>` en camelCase | `clientes.titulo`, `comun.guardar` |

## 4. Cada pieza

- **Servicio de recurso**: `extends BaseHttpService`, `providedIn: 'root'`, un método
  por endpoint con tipos de entrada y salida
  (`listar(): Observable<Cliente[]>`). La URL base sale de `environment`. Los
  errores llegan como `ErrorApi { status, message, tipo }`: el componente pinta
  `e.message` (lo redacta el servidor) o reacciona a `e.tipo`.
- **API que envuelve sus respuestas** (`{ data: … }`, proyectos del curso): se
  desenvuelve **una vez** en `BaseHttpService` (`map(r => r.data)`) y los servicios
  declaran el tipo de verdad. Nunca `Observable<X[]>` cuando llega `{ data: X[] }`
  ni `any` para leer `.data`.
- **Pantalla (padre)**: carga datos, guarda el estado con `signal`, deriva con
  `computed`, decide qué pasa al editar o borrar. Pinta **cargando, vacío y error**
  (con botón de reintentar). No pasa de ~300 líneas de TypeScript: si pasa, se
  extraen hijos.
- **Hijo de presentación**: recibe con `input()`, avisa con `output()`. No navega
  ni llama a servicios.
- **Pipe**: transforma un valor para mostrarlo (puro). Un formato que se repite en
  dos plantillas es un pipe, no una función llamada desde el HTML.
- **Estado compartido** por pantallas no anidadas: servicio `providedIn: 'root'` con
  `signal` privada y lecturas públicas (`SesionService` es el modelo). NgRx solo con
  varios equipos o flujos de eventos complejos.
- **Rutas**: todo con `loadComponent`; cada zona es un layout con hijas y su guard
  (`authGuard`, `rolGuard('admin')`). Los parámetros (`:id`, `?volver=`) llegan como
  `input()` gracias a `withComponentInputBinding()`.
- **Guards e interceptores funcionales** (`CanActivateFn`, `HttpInterceptorFn`). Los
  guards son navegación, no seguridad: el backend comprueba todo otra vez.
- `inject()` en vez de constructor; `@if`/`@for`; acceso a `sessionStorage`/`window`
  protegido (`typeof sessionStorage === 'undefined'`). `strict` y `strictTemplates`:
  prohibido `any` en código nuevo (también `$any()` en plantillas).

## 5. Formularios

Formularios reactivos (`FormBuilder` no anulable) con los validadores y los límites
de `shared/regex.ts`, los mismos números que el backend. Crear y editar son la
**misma pantalla**, distinguida por el `id` de la ruta. Los errores del servidor
con `tipo` de campo (`NOMBRE_REPETIDO`) se pintan junto a ese campo; el resto, como
error general del formulario.

**Referencia a otro recurso** (categoría de un producto): `mat-select` con las
opciones del servicio del otro recurso, cargadas al abrir la pantalla; opción
«Sin categoría» con valor `null` si es opcional. Lo que se envía es el id
(`categoria_id`), nunca el objeto. Si la API responde `REFERENCIA_INVALIDA`, se
pinta junto al select.

## 6. Listados con tabla de Material

`MatTable` + `MatSort` + `MatPaginator` con `MatTableDataSource`, orden y paginación
en el navegador mientras la lista quepa en una respuesta. La búsqueda es un
`computed` sobre la lista y un `effect` vuelca el resultado en la fuente.

- El nombre de cada columna es el del campo: así `mat-sort-header` sabe por qué
  ordenar. Una columna que muestra algo **anidado** (`categoria.nombre`) o
  calculado necesita `sortingDataAccessor`:
  ```ts
  this.fuente.sortingDataAccessor = (p, columna) =>
    columna === 'categoria' ? (p.categoria?.nombre ?? '') : (p[columna as keyof Producto] as string | number);
  ```
- Textos del paginador traducidos con `PaginadorTraducido` (un `MatPaginatorIntl`),
  registrado en el **layout de la zona** (`panel-layout.ts`), no en `app.config.ts`:
  ahí metería el paginador entero en la carga inicial (de ~330 kB a ~640 kB).
- Móvil: las columnas secundarias llevan `hidden sm:table-cell` para que quepan
  nombre y acciones, y la tabla va dentro de un `overflow-x-auto`. Si un dato oculto
  es imprescindible, se muestra debajo del nombre en pequeño (`sm:hidden`), no se
  pierde.
- Cuando la lista ya no quepa en una respuesta: filtros y paginación en el
  servidor como parámetros **opcionales** y `MatPaginator` en modo servidor.

## 7. Textos e idioma

Cada texto de la interfaz es una clave en `public/i18n/es.json` **y** en `en.json`
(las dos a la vez, o el otro idioma enseña la clave). Los mensajes de error **no**
son claves: los redacta el servidor en castellano y llegan en `e.message`. El
idioma activo lo guarda `IdiomaService`; la primera vez sale del navegador. El
formato de números y monedas, en cambio, lo fija `LOCALE_ID` (`es-ES`): un navegador
en inglés ve los textos en inglés y los precios como `12,50 €`. Si eso no vale, el
formato también tiene que seguir al idioma (pasarlo como argumento a los pipes). Si el proyecto solo va en castellano, se
puede dejar ngx-translate (cuesta poco) o quitarlo junto con `idioma.service.ts`,
`public/i18n/` y el botón ES/EN del layout.

## 8. Fechas y horas

- Contrato: fechas en **ISO 8601 UTC** (`"2026-10-20T08:30:00.000Z"`); día sin hora
  como `"2026-10-20"`. La interfaz TS las declara `string`.
- Mostrar: `{{ f | date: 'short' }}` (usa `LOCALE_ID` `es-ES`, registrado en
  `app.config.ts`) o `tiempoRelativo` para «hace 3 días». Con cambio de idioma en
  caliente, pasa el idioma como argumento del pipe (`date: 'short' : undefined :
  idioma.actual()`), porque `LOCALE_ID` no cambia sin recargar.
- Introducir: `<input type="date">` o `type="datetime-local"` para empezar (sin
  dependencias); `MatDatepicker` con `provideNativeDateAdapter()` en el componente
  si se quiere el calendario de Material. Antes de enviar, `new Date(valor).toISOString()`
  para una hora; para un día, la cadena `yyyy-MM-dd` tal cual (convertirla a UTC
  puede moverla al día anterior).
- Editar: un `datetime-local` espera la hora **local** sin zona
  (`2026-10-20T10:30`). Para cargar lo que llega de la API:
  ```ts
  // "2026-10-20T08:30:00.000Z" -> "2026-10-20T10:30" en Madrid (verano)
  const aLocal = (iso: string) => {
    const f = new Date(iso);
    return new Date(f.getTime() - f.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  };
  ```
  Al guardar, `new Date(valor).toISOString()` lo devuelve a UTC. El backend tiene que
  **exigir** la zona, porque ni `isISO8601({ strict: true })` ni un `DateTime?` de .NET
  rechazan `"2026-10-20T10:30"` (la tomarían como hora del servidor):
  - Node: `.isISO8601({ strict: true }).matches(/(Z|[+-]\d{2}:\d{2})$/).withMessage("La fecha
    tiene que llevar zona horaria")`;
  - .NET: `string?` con el atributo `[FechaConZona]` de `backend-dotnet.md` §6 y
    `DateTimeOffset.Parse(…).UtcDateTime` al guardar. Ojo: un `DateTimeOffset?` en el
    DTO **no** sirve, porque acepta la hora sin zona y le pone +00:00 en silencio.
- Horarios de un negocio (franjas de 8 a 22, «no reservar en el pasado»): las
  reglas se comprueban en el **backend** con la zona horaria del negocio en
  configuración (`ZONA_HORARIA=Europe/Madrid`), no con la del navegador ni la del
  servidor.

## 9. Avisos

Solo `NotificacionesService`: `aviso('clave')` (snackbar breve), `error(e.message)`
(snackbar que se cierra a mano) y `await confirmar({ titulo, texto, confirmar,
peligroso })` (SweetAlert2). Ningún componente importa `MatSnackBar` ni `Swal`.

## 10. Suscripciones

Toda llamada que se suscribe en un componente lleva
`.pipe(takeUntilDestroyed(this.destruir))` con
`private readonly destruir = inject(DestroyRef)`. Aunque `HttpClient` completa
solo, si el usuario se va con la petición en vuelo la respuesta llegaría a un
componente destruido y podría navegar o avisar fuera de sitio. Dentro del
constructor vale `takeUntilDestroyed()` sin argumento; fuera (en un método), lanza
error. Para leer datos que solo se pintan, `toSignal()` también vale.

## 11. Pruebas

`CI=1 npx ng test --watch=false` (Vitest). Tres ejemplos en la plantilla:

- **Función pura / pipe** (`tiempo-relativo-pipe.spec.ts`): sin TestBed.
- **Servicio** (`productos.service.spec.ts`): `provideHttpClient()` +
  `provideHttpClientTesting()`; comprueba URL, verbo y cuerpo con
  `HttpTestingController`.
- **Componente** (`productos.spec.ts`): TestBed con `provideHttpClient()`,
  `provideHttpClientTesting()`, `provideRouter([])`, `provideTranslateService()`
  sin loader (las claves salen tal cual), `registerLocaleData(localeEs)` + `LOCALE_ID`
  (sin eso el pipe `currency` revienta) y `sessionStorage` sembrado con una sesión
  (y limpiado en `afterEach`). Prueba lo que ve el usuario: filas, vacío, error,
  filtro.

Una prueba que no falla sin el cambio no prueba nada: rompe lo que protege y
comprueba que se pone roja. Para los recorridos que dan dinero, e2e con Playwright.

## 12. Formato del código

`npm run formato` (Prettier con `.prettierrc.json`) antes de cerrar un cambio;
`npm run formato:comprobar` es lo que miraría una CI. Un proyecto existente con
otro formateador sigue con el suyo.

## 13. Copiar `productos` para un recurso nuevo

```
src/app/shared/regex.ts                         + los mismos límites / enumerados que el backend
src/app/interfaces/cliente.ts                   ← producto.ts
src/app/services/clientes.service.ts            ← productos.service.ts (+ su .spec.ts)
src/app/components/panel/clientes/…             ← productos/ (listado, hijo, formulario, .spec.ts)
src/app/app.routes.ts                           + hijas de 'panel' (rolGuard donde se escriba)
src/app/components/panel/panel-layout/panel-layout.html   + enlace en el menú
public/i18n/es.json, en.json                    + sección "clientes" y la clave panel.menu.clientes
```

## 14. Crecer a carpetas por funcionalidad

Cuando `services/` e `interfaces/` superan ~15 ficheros, o varias personas
trabajan a la vez en áreas distintas, se pasa a
`app/features/<recursos>/{pantallas/, <recursos>.service.ts, <recurso>.ts,
<recursos>.routes.ts}`. Es una decisión de proyecto: se hace de una vez por
funcionalidad y se anota en `docs/decisiones.md`. Mezclar las dos estructuras sin
decidirlo es una segunda arquitectura en paralelo.
