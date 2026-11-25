# PLAN — SaaS-O-Matic

La spec (`01-SPEC.md`) partida en bloques, en orden de dependencias. Cada bloque se hace,
se revisa y se acepta antes de empezar el siguiente.

Reglas para todos los bloques:

- «Terminado» siempre incluye los comandos de `CLAUDE.md` en verde (los del frontend, desde F1) y
  que cada prueba nueva se ponga roja si se quita lo que protege.
- Al acabar un bloque: diff y resumen de lo que no se ha podido comprobar. Sin commit hasta revisarlo.
- Si un bloque se pasa de 200 líneas en un fichero o de ~15 minutos de revisión, se parte antes de seguir.
- Modelo de cada fichero: su equivalente en la plantilla Node o Angular de la skill, quitando lo que
  `docs/decisiones.md` descarta.

---

## Contrato

La spec da los campos de entrada, pero no los nombres de todos los de salida. Todo importe lleva el
sufijo `_centimos` y es un entero.

- **Cliente:** `id`, `nombre_empresa`, `identificador_fiscal`, `email_contacto`, `pais`, `plan`, `fecha_creacion`.
- **Cálculo** (`POST /simulations/calcular`): `usuarios`, `pais`,
  `tramos: [{ desde, hasta, usuarios, precio_unitario_centimos, subtotal_centimos }]`, `coste_base_centimos`,
  `porcentaje_impuesto`, `impuesto_centimos`, `total_centimos`. `hasta` es `null` en el último tramo.
- **Simulación:** `id`, `cliente_id`, `usuarios`, `almacenamiento_gb`, `llamadas_api`, `coste_base_centimos`,
  `porcentaje_impuesto`, `impuesto_centimos`, `total_centimos`, `fecha_creacion`. El desglose por tramos
  no se guarda: sale de `usuarios` y de los tramos de hoy, y podría no cuadrar con un presupuesto antiguo.

`porcentaje_impuesto` es un entero (21, 19…).

---

## Backend

### B1 · Esqueleto, errores y seguridad común

- **Spec:** §8 (Node + Express + TypeScript, SQLite), §4 «Común a todas» y «Seguridad» (100 KB, CORS,
  500 sin detalles).
- **Ficheros:** `backend/package.json` (scripts `dev`, `build`, `start`, `tipos`, `test`),
  `tsconfig.json`, `vitest.config.ts`, `.gitignore` (BD y `dist/`), `src/config.ts`,
  `src/utils/logger.ts`, `src/utils/errores.ts` (`ErrorHttp`), `src/data/db.ts` (fichero en desarrollo,
  memoria en pruebas), `src/app.ts` (JSON con límite de 100 KB, CORS solo para el origen de `config.ts`,
  `GET /salud`, 404 de ruta desconocida, manejador global), `src/server.ts` (`sequelize.sync()` y
  `listen` en el 3000), `tests/_api.ts` (arranca la app real en un puerto libre), `tests/config.test.ts`,
  `tests/app.test.ts`.
- **Pruebas:**
  - `GET /salud` → 200 `{ estado: "ok" }`.
  - Una configuración inválida (puerto no numérico) hace fallar el arranque.
  - Ruta desconocida → 404 `NO_ENCONTRADO` con `message`, `tipo` y `errors: []`.
  - JSON mal formado → 400 `VALIDACION`.
  - Cuerpo de más de 100 KB → 413 `DEMASIADO_GRANDE`.
  - Origen no permitido → 403 `CORS`. Origen del frontend → lleva su cabecera CORS.
- **Terminado:** `npm run dev` arranca y responde a `/salud`. Todo error sale con las tres claves y
  ninguno enseña la pila ni el mensaje interno.

### B2 · Validación del identificador fiscal

- **Spec:** §3 «Validación del identificador fiscal», §6 (NIE, CIF C D F G J U V).
- **Ficheros:** `src/utils/identificadorFiscal.ts` (normalizar, DNI, NIE, CIF, fuera de España;
  funciones puras), `tests/identificadorFiscal.test.ts`.
- **Pruebas:**
  - Tabla de §7 «Identificador fiscal» completa: las 8 filas.
  - CIF de letra C D F G J U V: acepta el control en número y en letra.
  - Fuera de España: acepta de 4 a 20 letras y números. Rechaza 3 caracteres, 21 o un símbolo.
- **Terminado:** cada tipo (DNI, NIE, CIF número, CIF letra) tiene un caso válido y uno inválido.

### B3 · Constantes y servicio de precios

- **Spec:** §3 «Coste mensual base» e «Impuesto».
- **Ficheros:** `src/utils/regex.ts` (`LIMITES`, `PLANES`, `PAISES` con IVA, `TRAMOS` en céntimos),
  `src/services/precios.service.ts`, `tests/precios.test.ts`.
- **Pruebas:**
  - Tabla de §7 «Tramos», filas de 1 a 100.
  - Tabla de §7 «Impuesto» (ES 15, DE 51, FR 10).
  - El desglose de 15 usuarios es 10 × 10 € + 5 × 8 €.
  - La fila «0 → rechazado» se prueba en B4, porque la frena el validador.
- **Terminado:** los tramos se recorren desde `TRAMOS`, sin un `if` por tramo. El servicio no sabe
  nada de HTTP.

### B4 · `POST /simulations/calcular`

- **Spec:** §4 «POST /simulations/calcular», §6 «¿0 usuarios?».
- **Ficheros:** `src/validators/_handle.ts` (400 `VALIDACION` con `errors`),
  `src/validators/simulaciones.validator.ts` (reglas de calcular), `src/controllers/simulaciones.controller.ts`
  (calcular), `src/routes/simulaciones.route.ts`, `src/app.ts` (montar `/simulations`),
  `tests/simulaciones-calcular.test.ts`.
- **Pruebas:**
  - ES y 15 usuarios → 200 con desglose, `coste_base_centimos` 14000, `porcentaje_impuesto` 21,
    `impuesto_centimos` 2940 y `total_centimos` 16940.
  - 0 usuarios → 400 con `errors` en `usuarios` (§7 Tramos).
  - 100.001 o 2,5 usuarios → 400.
  - País fuera de la lista → 400 con `errors` en `pais` (§7 API).
- **Terminado:** el controlador lee con `matchedData` y no tiene `try/catch`.

### B5 · Clientes: modelo y `POST /customers`

- **Spec:** §2 «Clientes», §3 «Validación del identificador fiscal», §4 «POST /customers» y «Seguridad».
- **Ficheros:** `src/models/cliente.model.ts` (índice único en `identificador_fiscal`,
  `fecha_creacion`, sin `updatedAt`), `src/validators/clientes.validator.ts` (primero limpia, luego
  valida), `src/controllers/clientes.controller.ts` (crear), `src/routes/clientes.route.ts`,
  `src/app.ts` (montar `/customers`), `tests/clientes-crear.test.ts`.
- **Pruebas:**
  - 201 normalizado: `a-58.818.501` → `A58818501`, espacios del nombre limpiados, email en minúscula.
  - Identificador fiscal falso → 400 con `errors` en `identificador_fiscal`.
  - País fuera de la lista y plan desconocido → 400, cada uno en su campo (§7 API).
  - Nombre de 1 o de 121 caracteres y email de 255 → 400.
  - Cliente duplicado → 409 `IDENTIFICADOR_REPETIDO` (§7 API).
  - Carrera frenada por el índice (`vi.spyOn`) → 409 `DUPLICADO`.
  - Error inesperado del modelo → 500 sin detalles.
  - Campos de más (`id`, `fecha_creacion`) se ignoran.
- **Terminado:** en la BD queda el identificador normalizado y solo los campos esperados.

### B6 · Simulaciones: modelo y `POST /simulations`

- **Spec:** §2 «Simulación» y notas, §3 «Impuesto» (país del cliente), §4 «POST /simulations».
- **Ficheros:** `src/models/simulacion.model.ts`, `src/models/associations.ts`,
  `src/validators/simulaciones.validator.ts` (reglas de guardar), `src/controllers/simulaciones.controller.ts`
  (crear), `src/routes/simulaciones.route.ts`, `tests/simulaciones-crear.test.ts`.
- **Pruebas:**
  - Cliente DE y 51 usuarios → 201 con `coste_base_centimos` 42500, `porcentaje_impuesto` 19,
    `impuesto_centimos` 8075 y `total_centimos` 50575 (§7 Impuesto), guardado en la BD.
  - Cliente que no existe → 400 `REFERENCIA_INVALIDA` en `cliente_id` (§7 API).
  - Un `pais` en el cuerpo no cambia el impuesto: manda el del cliente.
  - Límites de `almacenamiento_gb` (0 a 1.000.000) y `llamadas_api` (0 a 1.000.000.000) → 400 fuera de rango.
- **Terminado:** la simulación guarda el % aplicado y los importes que devuelve el servicio de precios.
  No hay ruta para editarla.

### B7 · Lecturas: buscador, detalle e historial

- **Spec:** §4 «GET /customers?q=texto», «GET /customers/:id» y «GET /customers/:id/simulations»;
  §6 «¿Buscador sin texto?» y «¿% y \_ en la búsqueda?».
- **Ficheros:** `src/validators/clientes.validator.ts` (`q`, `id`), `src/controllers/clientes.controller.ts`
  (listar, obtener, historial), `src/routes/clientes.route.ts`, `tests/clientes-leer.test.ts`.
- **Pruebas:**
  - Encuentra por parte del nombre y por parte del identificador, sin distinguir mayúsculas.
  - Con 51 coincidencias devuelve 50, ordenadas por nombre.
  - Sin `q` o con `q` vacío → los 50 primeros por nombre.
  - `q=%` y `q=_` no devuelven todo: solo los clientes que llevan ese carácter.
  - Sin resultados → 200 `[]`.
  - `GET /customers/999` → 404 `NO_ENCONTRADO`. `GET /customers/abc` → 400.
  - Historial: solo las simulaciones del cliente, la más nueva primero. Sin simulaciones → `[]`.
    Cliente que no existe → 404.
- **Terminado:** la búsqueda usa `Op.like` del ORM con `%` y `_` escapados; no hay SQL montado con texto.
  El backend cubre los siete endpoints de §4.

### B8 · Datos de ejemplo

- **Spec:** §9 «Datos de ejemplo».
- **Ficheros:** `scripts/datos-ejemplo.ts`, `package.json` (script `datos-ejemplo`),
  `tests/datos-ejemplo.test.ts`.
- **Pruebas** (contra la BD en memoria):
  - Crea 5 clientes, uno por país, y cada uno con 2 o 3 simulaciones.
  - Todos los identificadores pasan la validación de B2.
  - Los importes guardados son los que da el servicio de precios.
  - Lanzarlo dos veces no duplica clientes ni simulaciones.
- **Terminado:** con la BD vacía, `npm run datos-ejemplo` deja datos que se ven por la API. El script
  usa los modelos y el servicio de precios; no escribe importes a mano.

---

## Frontend

### F1 · Esqueleto del frontend y aspecto base

- **Spec:** §5 «Común a todas» (responsive), §8.
- **Ficheros:** proyecto Angular 21 en `frontend/` (`package.json`, `angular.json`, `tsconfig*`),
  `src/material-theme.scss` (tema ajustado al diseño), `src/styles.css` (Tailwind con los colores del tema),
  `src/environments/*` (`apiUrl` `http://localhost:3000`), `src/app/app.config.ts` (`LOCALE_ID` `es-ES`),
  `src/app/app.routes.ts`, `components/layout/` (cabecera con hueco para el selector de divisa),
  `components/compartidos/cargando/`, `components/no-encontrado/`.
- **Pruebas:** `ng build` sin avisos y `ng test` con la prueba de arranque.
- **Terminado:** `ng serve` muestra el layout en móvil y en escritorio. El aspecto sale de la skill
  `frontend-design`, dentro de lo fijado en «Estilos».

### F2 · Contrato y conversión de divisas

- **Spec:** §4 (JSON, forma del error), §2 (límites), §5 «Selector de divisa» (redondeo por línea).
- **Ficheros:** `shared/regex.ts` (gemelo de `backend/src/utils/regex.ts`), `interfaces/id.ts`,
  `interfaces/cliente.ts`, `interfaces/simulacion.ts` (también el cálculo),
  `services/base-http.service.ts` (`ErrorApi`), `services/notificaciones.service.ts`,
  `services/clientes.service.ts`, `services/simulaciones.service.ts`, `shared/divisas.ts` (convierte cada
  línea a 2 decimales y suma las convertidas), `pipes/importe.pipe.ts` (céntimos → texto en la divisa),
  y sus `.spec.ts`.
- **Pruebas:**
  - Cada método llama a su ruta y verbo, sin `/api`.
  - Un error del servidor llega como `ErrorApi` con `status`, `message`, `tipo` y `errors`.
  - El total convertido es la suma de las líneas convertidas, también cuando convertir el total
    de golpe daría un céntimo distinto.
  - En EUR no cambia nada.
- **Terminado:** `shared/regex.ts` tiene los mismos valores que el del backend, con el comentario en los
  dos. Nada convierte fuera de `shared/divisas.ts`, y los servicios siguen en céntimos de euro.

### F3 · Servicio y selector de divisa

- **Spec:** §5 «Selector de divisa», §6 «¿Cuánto se espera a la API de divisas?» y «¿Los tipos de cambio
  se guardan entre recargas?», §7 «Pantalla: API de divisas caída».
- **Ficheros:** `services/divisas.service.ts` (`HttpClient` directo, tipos y divisa activa en signals,
  espera máxima de 5 s), `components/compartidos/selector-divisa/`, `components/layout/` (lo coloca),
  y sus `.spec.ts`.
- **Pruebas** (con temporizadores falsos):
  - Los tipos se piden una sola vez aunque haya varios consumidores.
  - API caída → divisa EUR, el selector no deja cambiar y sale un aviso (§7).
  - Sin respuesta a los 5 s → mismo comportamiento que caída. Respuesta antes de 5 s → se usan los tipos.
- **Terminado:** el selector se ve en todas las pantallas. Los tipos viven solo en memoria: ni
  `localStorage` ni `sessionStorage`.

### F4 · Buscador y dashboard

- **Spec:** §5 «Buscador y Dashboard», «Común a todas», §6 «¿Buscador sin texto?».
- **Ficheros:** `components/clientes/clientes-buscador/` (padre: `q` en signal, `debounceTime(300)` +
  `switchMap`), `components/clientes/cliente-tarjeta/` (hijo), `app.routes.ts`, y sus `.spec.ts`.
- **Pruebas** (con temporizadores falsos):
  - Al entrar se piden los clientes sin `q` y se pintan.
  - Varias teclas en menos de 300 ms → una sola petición.
  - Una búsqueda nueva cancela la anterior.
  - Lista vacía → «No hay resultados».
  - Error → mensaje claro.
  - Mientras espera → spinner.
- **Terminado:** las tarjetas son de Tailwind (sin `mat-card`) y llevan al detalle. Hay un botón de alta.

### F5 · Alta de cliente

- **Spec:** §5 «Alta de cliente», §6 «¿El formulario valida la letra de control?».
- **Ficheros:** `components/clientes/cliente-alta/` (padre: envía y reparte los errores),
  `components/clientes/cliente-formulario/` (hijo: formulario reactivo con `LIMITES`, `PAISES`, `PLANES`),
  `app.routes.ts`, y sus `.spec.ts`.
- **Pruebas:**
  - Cada campo avisa en vivo con los límites de `shared/regex.ts`.
  - El identificador fiscal solo se comprueba en formato y longitud: `12345678A` pasa el formulario.
  - Un 400 con `errors` en `identificador_fiscal` (por ejemplo, `12345678A`) se pinta junto a ese campo.
  - Un 409 `IDENTIFICADOR_REPETIDO` se pinta junto al identificador.
  - Al crear → aviso y navegación al detalle.
- **Terminado:** país y plan son `mat-select`. No se puede enviar el formulario con un campo inválido.
  El frontend no tiene el algoritmo de la letra de control.

### F6 · Detalle del cliente e historial

- **Spec:** §5 «Detalle del cliente (cards)».
- **Ficheros:** `components/clientes/cliente-detalle/` (padre: cliente e historial en signals),
  `components/clientes/cliente-datos/` (hijo, tarjetas), `components/simulaciones/historial-simulaciones/`
  (hijo), `app.routes.ts`, y sus `.spec.ts`.
- **Pruebas:**
  - Pinta los datos y el historial en el orden en que llega.
  - Al cambiar la divisa, los importes cambian sin pedir nada al backend.
  - Cliente que no existe → mensaje de «no existe».
  - Sin simulaciones → estado vacío.
- **Terminado:** cargando, vacío y error en las dos partes, en tarjetas responsive.

### F7 · Simulador: slider, cálculo en vivo y guardar

- **Spec:** §5 «Simulación interactiva», §2 (almacenamiento y llamadas, sin tarifa), §6 «¿Quién calcula
  el slider?», «¿Rango del slider?» y «¿Dónde está el simulador?».
- **Ficheros:** `components/simulaciones/simulador/` (padre: `debounceTime(250)` + `switchMap`, último
  resultado y `calculando` en signals; slider de 1 a 200 y campo numérico de 1 a 100.000; almacenamiento,
  llamadas y botón guardar; `output()` con la simulación guardada), `components/simulaciones/desglose-precio/`
  (hijo), `components/clientes/cliente-detalle/` (lo coloca y añade la guardada al historial),
  y sus `.spec.ts`.
- **Pruebas** (con temporizadores falsos):
  - Mover el slider varias veces en menos de 250 ms → una petición, con el `pais` del cliente.
  - El slider y el campo numérico van juntos: mover uno cambia el otro. Con 500 en el campo, el slider
    se queda al máximo y se calcula con 500.
  - Fuera de 1 a 100.000 en el campo → aviso junto al campo y ninguna petición.
  - Un cambio nuevo cancela la petición en vuelo.
  - Mientras calcula, el precio anterior sigue a la vista atenuado y con «calculando». Al llegar la
    respuesta, se ve el nuevo sin atenuar. Si falla, no queda un precio viejo presentado como vigente.
  - Guardar envía `cliente_id`, `usuarios`, `almacenamiento_gb` y `llamadas_api`, y nada más.
  - La simulación guardada aparece la primera del historial sin recargar.
  - Un 400 se pinta junto a su campo. El botón no deja guardar dos veces seguidas.
- **Terminado:** el frontend no tiene ninguna fórmula de precio: solo pinta lo que devuelve
  `/simulations/calcular`. Almacenamiento y llamadas no cambian el precio mostrado.

### F8 · Animaciones y repaso visual

- **Spec:** §5 «Animaciones», «Común a todas» (responsive), §4 «Seguridad» (sin `innerHTML`).
- **Ficheros:** las plantillas y `.css` de los componentes ya creados (transiciones al aparecer,
  desaparecer, seleccionar y hover).
- **Pruebas:** las de todos los bloques siguen en verde. `grep` de `innerHTML` sin resultados con datos
  del usuario.
- **Terminado:**
  - Transiciones cortas (no retrasan ningún clic).
  - Revisado a mano en móvil y escritorio: alta, búsqueda, detalle, slider, guardar y divisa caída.
  - Lo que no se haya podido probar en el navegador queda dicho en el resumen.

---

## Bloque final · Auditoría y entrega

- **Spec:** toda. Este bloque no añade funcionalidad: comprueba que lo hecho cumple.
- **Ficheros:**
  - `ai-workspace/04-calidad/cobertura-spec.md`: cada regla de §2 a §6, §9 y cada caso de §7, con la
    prueba que lo demuestra o el motivo de que se compruebe a mano.
  - `ai-workspace/04-calidad/auditoria.md`: repaso con el checklist de la skill (SKILL.md §7 y
    `references/revision.md`), las prohibiciones y tamaños de `CLAUDE.md` (200 líneas por fichero, 40 por
    función) y `npm audit` en los dos proyectos. Cada hallazgo, con lo que se hizo: corregido o anotado y
    por qué.
  - `ai-workspace/04-calidad/clon-limpio.md`: los comandos del README ejecutados en un clon nuevo, en una
    carpeta temporal, y lo que salió.
  - `README.md`: requisitos (versión de Node), instalar, datos de ejemplo, arrancar backend y frontend,
    lanzar las pruebas.
- **Pruebas:** todos los comandos de `CLAUDE.md` en verde. El README seguido al pie de la letra en el clon
  limpio deja la app funcionando con los datos de ejemplo.
- **Terminado:** ningún punto de la spec sin prueba o sin motivo; ningún hallazgo abierto sin anotar; el
  README funciona en el clon sin pasos que no estén escritos. Necesita que el trabajo esté en commits,
  porque el clon solo ve lo que hay en git.
