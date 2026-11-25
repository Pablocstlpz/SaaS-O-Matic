# Auditoría de código — SaaS-O-Matic

Fecha: 2026-11-25 · Commit revisado: `4d989fe` · Alcance: `backend/` y `frontend/` contra
`ai-workspace/01-SPEC.md`, `CLAUDE.md` y `docs/decisiones.md`. Es una revisión: no se ha cambiado
código. Las mutaciones de las pruebas se deshicieron y el árbol de trabajo quedó limpio (`git status`
vacío).

## Resumen

1. **No hay fallos críticos ni altos.** Las reglas de negocio cumplen la spec en todos los casos probados: 500 000 combinaciones de tramos e IVA y 1,19 millones de identificadores fiscales.
2. **Un fallo real en el código (media):** cuando dos simulaciones tienen la misma `fecha_creacion`, el historial pone primero la más vieja.
3. **Seguridad bien resuelta:** ORM con escape, `matchedData`, CORS de un solo origen, errores 500 sin detalles, cuerpo limitado a 100 KB y nada de `innerHTML`. El contrato coincide campo a campo con las interfaces del frontend.
4. **Las pruebas son buenas** (las 5 elegidas al azar fallan al romper lo que protegen), pero dejan sin cubrir tres cosas: el NIE con Z, la letra inicial del CIF y los campos de más en `POST /simulations`.
5. El resto son detalles de nivel bajo: límites que no coinciden con emojis, caracteres de control en el nombre, NIF K/L/M y lógica copiada entre backend y frontend.

Estado de partida (antes de tocar nada):

| Comando                                  | Resultado                     |
| ---------------------------------------- | ----------------------------- |
| `cd backend && npm run tipos && npm test` | sin errores · 119/119 pruebas |
| `cd frontend && npx ng build`            | sin errores ni avisos         |
| `cd frontend && CI=1 npx ng test`        | 46/46 pruebas                 |
| `grep` de `console.log` y `any`          | sin resultados                |

## Hallazgos

| # | Gravedad | Fichero y línea | Qué pasa | Cómo lo comprobé | Cómo se arreglaría |
| - | -------- | --------------- | -------- | ---------------- | ------------------ |
| 1 | Media | `backend/src/controllers/clientes.controller.ts:57` | `GET /customers/:id/simulations` ordena solo por `fecha_creacion DESC`. Si dos simulaciones caen en el mismo milisegundo, SQLite las devuelve por `id` ascendente: **la más vieja primero**, en contra de la spec §4. Pasa casi siempre con `npm run datos-ejemplo`, que crea las simulaciones seguidas. | Script que lanza `crearDatosEjemplo()` 20 veces sobre SQLite en memoria y compara el orden de la consulta con el de los `id`: en **37 de 100** historiales había fechas repetidas y en los 37 el orden salía al revés (p. ej. ids `[11, 12]` con la misma fecha `17:29:58.827`). La prueba `clientes-leer.test.ts:79` no lo ve porque sus fechas son todas distintas. | `order: [["fecha_creacion", "DESC"], ["id", "DESC"]]`, y una prueba con dos simulaciones de la misma fecha. |
| 2 | Media | `backend/tests/simulaciones-crear.test.ts` (código protegido: `simulaciones.controller.ts:43`) | Ninguna prueba comprueba que `POST /simulations` ignora los campos de más (spec §4 Seguridad: «solo se guardan los campos esperados»). El código está bien hoy, pero una regresión pasaría sin que nada fallara. | Mutación: añadir `...req.body` a `Simulacion.create(...)` → **119/119 en verde**. Con la API real, mandar `id`, `fecha_creacion` e importes falsos sí se ignora (201 con los importes del servidor y otro `id`). | Una prueba como `clientes-crear.test.ts:59`: enviar `id`, `fecha_creacion`, `porcentaje_impuesto`, `coste_base_centimos`… y comprobar en la respuesta y en la BD que no se usan. |
| 3 | Media | `backend/tests/identificadorFiscal.test.ts` (código protegido: `utils/identificadorFiscal.ts:30` y `:54`) | Hay dos reglas de la spec §3 sin prueba: (a) el NIE que empieza por **Z** (Z→2); (b) que un CIF con una letra inicial **fuera de las tres listas** (K, L, M, T…) se rechace. | Mutación (a): `"XYZ"` → `"XYW"`, con lo que se rechazan todos los NIE con Z → **119/119 en verde**. Mutación (b): quitar `CIF_CONTROL_CUALQUIERA.includes(inicial) &&`, con lo que se acepta `K58818501` → **119/119 en verde**. | Añadir `Z1234567R` (válido) y, por ejemplo, `K58818501` y `T5881850A` (inválidos) a la tabla de la prueba. |
| 4 | Baja | `backend/src/utils/identificadorFiscal.ts:9-12` | Los **NIF K, L y M** (personas físicas sin DNI ni NIE, que existen de verdad) se rechazan siempre. La spec solo nombra DNI, NIE y CIF, así que el código la cumple: es un hueco de la spec, no del código. | Con `K1234567?`, `L1234567?` y `M1234567?`, ninguno de los 36 caracteres de control posibles se acepta. | Preguntar a negocio (CLAUDE.md: «para y pregunta»). Si se admiten, hay que añadirlos a la spec y a `identificadorFiscal.ts` con su algoritmo. |
| 5 | Baja | `frontend/src/app/components/clientes/cliente-formulario/formulario-cliente.ts:56` | El formulario cuenta el nombre con `length` (unidades UTF-16) y la API con `isLength` (puntos de código). Con emojis, los límites no coinciden: 1 emoji pasa el formulario y la API da 400; 61 emojis los acepta la API (201) y el formulario los rechaza. La spec §5 pide «los mismos límites que el backend». | API: `nombre_empresa: "😀"` → 400 y `"😀".repeat(61)` → 201. Node: `'😀'.length === 2` y `'😀'.repeat(61).length === 122`. | Contar con `[...limpio].length` en el formulario. |
| 6 | Baja | `backend/src/validators/clientes.validator.ts:24-28` | `nombre_empresa` solo rechaza el carácter nulo. Admite otros caracteres de control y los de dirección del texto (U+202E «RLO»), que dan la vuelta a lo que se ve en tarjetas y en el detalle. Angular escapa el texto, así que no hay XSS: el problema es solo de presentación y suplantación. | `POST /customers` con `"Ac\u0007me‮evil"` → 201, y se guarda tal cual. | Rechazar `\p{Cc}` y `[‪-‮⁦-⁩]` con el mismo `.not().matches(...)` del nulo. |
| 7 | Baja | `backend/src/controllers/clientes.controller.ts:37` | El buscador no normaliza `q` como el identificador guardado. `A-58818` no encuentra `A58818501`, aunque el formulario de alta sí acepta escribirlo con guiones y puntos. La spec no dice si `q` se normaliza, así que es una duda más que un fallo. | `GET /customers?q=A-58818` → `[]`; `q=a58818` → encuentra el cliente. | Preguntar. Si se quiere, buscar el identificador con `normalizarIdentificador(q)` y el nombre con `paraBuscar(q)`. |
| 8 | Baja | `formulario-cliente.ts:24-25` ↔ `clientes.validator.ts:15` e `identificadorFiscal.ts:22`; `formulario-simulacion.ts:7-24` ↔ `simulaciones.validator.ts:8-24` | Hay lógica y textos copiados entre backend y frontend fuera de las constantes gemelas, y sin el comentario de «gemelo»: `limpiarNombre`, `normalizarIdentificador`, los formatos del identificador y todos los mensajes de error. Hoy coinciden, pero nada avisa si uno cambia. Dentro de cada lado también hay copias: `SIN_CLIENTE` (`clientes.controller.ts:16` y `simulaciones.controller.ts:20`), `PAISES.find(...)?.nombre` (`cliente-tarjeta.ts:18` y `cliente-datos.ts:19`) y `errorDeCampo` en tres ficheros de pruebas. | Lectura del código y `grep`. Las constantes gemelas `LIMITES`, `PLANES`, `PAISES` y `TRAMOS` se compararon importando los dos ficheros: son **idénticas**. | Llevar los textos y las limpiezas compartidas a los ficheros gemelos (con su comentario), o marcarlos como gemelos. Sacar `SIN_CLIENTE`, el nombre del país y `errorDeCampo` a un solo sitio. |
| 9 | Baja | Pruebas: `simulador.spec.ts:37` (149 líneas), `cliente-alta.spec.ts:28` (121), `layout.spec.ts:13` (113), `clientes-buscador.spec.ts:21` (110), `cliente-detalle.spec.ts:40` (109), `simulador-guardar.spec.ts:34` (109) y 5 `describe` del backend de 43 a 53 líneas | CLAUDE.md pone un máximo de 40 líneas por función, sin excepción para las pruebas. Solo lo pasan los callbacks de `describe`: ningún `it` ni ninguna función del código (la más larga del código tiene 27). | Script con el AST de TypeScript sobre los 107 ficheros: 421 funciones medidas. Ningún fichero pasa de 200 líneas (el mayor tiene 185). | Decidir si la regla cuenta los `describe` y apuntarlo en `docs/decisiones.md`; si cuenta, partir esos bloques. |
| 10 | Baja | `frontend/src/app/components/clientes/cliente-formulario/cliente-formulario.ts:43-47` | Al enviar un formulario con errores (o al recibir errores del servidor), el foco no va al primer campo con error, y al cambiar de pantalla tampoco se mueve. Para quien usa teclado o lector de pantalla, el aviso puede pasar desapercibido. | No hay ningún `focus()`, `cdkFocus*` ni `autofocus` en el código (`grep`). No lo he probado con un lector de pantalla. | Después de un envío fallido, llevar el foco al primer campo inválido. |

No he encontrado fallos **críticos** ni **altos**.

## Detalle por apartado

### 1. Reglas de negocio (con scripts)

- **Tramos.** Comparé `calcularPrecio` con una referencia que cobra usuario a usuario. Los bordes 1, 10, 11, 15, 50, 51, 100 y 100 000 dan 1000, 10000, 10800, 14000, 42000, 42500, 67000 y 50017000 céntimos, iguales a la referencia, y en todos la suma de los tramos es la base y la suma de usuarios es el total. El barrido de 1 a 100 000 en los 5 países no dio **ninguna diferencia**.
- **IVA y redondeo.** En el mismo barrido (500 000 casos), `porcentaje_impuesto` es el de la tabla, el impuesto es `Math.round(base × % / 100)`, el total es base + impuesto y los tres son enteros seguros. Coinciden los tres casos de §7 (ES 15 → 2940, DE 51 → 8075, FR 10 → 2000). Un dato a tener en cuenta: con los precios actuales (euros enteros) y un IVA entero, **ningún caso necesita redondear**. Por eso quitar `Math.round` no rompe ninguna prueba, y hoy no se puede escribir una que lo detecte. No es un fallo.
- **DNI, NIE y CIF.** Escribí una implementación de referencia a partir del texto de la spec y comparé **1 190 800 identificadores** con la de la app: 26 letras iniciales × 300 cuerpos aleatorios × 36 controles, 20 000 DNI × 26 letras y 15 000 NIE × 26 letras. Resultado: **0 diferencias**. CIF reales que se aceptan: Telefónica, Santander, Mercadona, Inditex, Iberdrola, CaixaBank, BBVA, AEAT, ayuntamientos de Madrid y de Barcelona, Real Madrid CF, FC Barcelona, Comunidad de Madrid y Universidad Complutense. Formas reales de escribirlos que se aceptan: `12345678-z`, ` 12.345.678 Z `, `x-1234567-l` y `z1234567r`. Lo que se rechaza: `1234567L` (DNI sin el cero inicial, porque la spec pide 8 cifras), `12345678–Z` (con raya en vez de guion) y los NIF K, L y M (hallazgo 4). No encontré ningún identificador inválido que se acepte. `00000000T` y `A00000000` se aceptan porque cuadra el control; la spec no pide más.
- **El IVA sale del cliente.** Creé un cliente ES y envié `POST /simulations` con `pais: "DE"`, `porcentaje_impuesto: 0`, `coste_base_centimos: 1`, `total_centimos: 1` e `id: 555`. Respuesta: 201 con 21 %, 14000, 2940 y 16940, y otro `id`. En `/simulations/calcular`, el `cliente_id` del cuerpo se ignora y manda el `pais`, como dice CLAUDE.md.

### 2. Seguridad

- **Inyección SQL:** `' OR 1=1 --`, `%' OR '1'='1`, `:patron`, `\`, `zz") OR 1=1--` y `q[$like]=x` dan 200 sin resultados de más. `%` y `_` se buscan como texto. El `literal` del `ESCAPE` es fijo y el texto entra por `replacements`.
- **Entrada:** `usuarios` como lista, objeto, `true`, `"1e3"` o `"0x10"` → 400. `pais: "es"` → 400. Un cuerpo `[1,2]` → 400. `__proto__` en el cuerpo → se ignora. `q` de más de 120 caracteres, repetido o con nulo → 400. Un id de 400 cifras → 400.
- **Tamaño:** 101 KB → 413 `DEMASIADO_GRANDE`; 99 KB → se lee y se valida. Un cuerpo `text/plain` de 200 KB no se lee, como dice `docs/decisiones.md`.
- **Asignación masiva:** `POST /customers` con `id`, `fecha_creacion` y `nombre_busqueda: "zzz"` → nada de eso se guarda (en la BD queda `nombre_busqueda: "acme"`). Para `/simulations`, ver el punto anterior y el hallazgo 2.
- **CORS:** solo `http://localhost:4200` lleva `Access-Control-Allow-Origin`. Un origen ajeno, `null` o el de la barra final → 403 `CORS`. La comprobación previa solo anuncia `GET,POST`.
- **Cabeceras:** no hay `X-Powered-By`; sí hay `nosniff`, `X-Frame-Options: SAMEORIGIN`, HSTS y `Cross-Origin-Resource-Policy: same-origin` (de helmet). `PUT`, `PATCH` y `DELETE` → 404 con la forma de error.
- **Errores 500:** la prueba `app.test.ts:103` mete un mensaje «secreto» y compara el cuerpo entero con `toEqual`: no se cuela. El detalle va solo al log.
- **Frontend:** no hay `innerHTML`, `bypassSecurityTrust*` ni `DomSanitizer`. Todo se pinta con interpolación.

### 3. Contrato

Con la API levantada comparé las claves de cada respuesta con las interfaces de `frontend/src/app/interfaces/`:

| Respuesta | Claves que devuelve la API | Interfaz |
| --------- | -------------------------- | -------- |
| `POST/GET /customers…` | `email_contacto, fecha_creacion, id, identificador_fiscal, nombre_empresa, pais, plan` | `Cliente`: iguales. `nombre_busqueda` no sale. |
| `POST /simulations`, historial | `almacenamiento_gb, cliente_id, coste_base_centimos, fecha_creacion, id, impuesto_centimos, llamadas_api, porcentaje_impuesto, total_centimos, usuarios` | `Simulacion`: iguales |
| `POST /simulations/calcular` | `coste_base_centimos, impuesto_centimos, pais, porcentaje_impuesto, total_centimos, tramos, usuarios` y, en cada tramo, `desde, hasta, precio_unitario_centimos, subtotal_centimos, usuarios` | `Calculo` y `LineaTramo`: iguales |
| Cualquier error | `message, tipo, errors[{campo, mensaje}]` | `ErrorApi`: igual. `aErrorApi` filtra lo que no tenga esa forma. |

Los códigos HTTP coinciden con §4 y con `docs/decisiones.md` (400, 404, 409 y 500, más 403 y 413).

### 4. Calidad de las pruebas

Elegí 5 pruebas al azar entre las 103 que hay (`shuf` con una semilla fija) y rompí a propósito lo que protege cada una:

| Prueba | Qué rompí | ¿Falla? |
| ------ | --------- | ------- |
| `clientes-leer.test.ts:79` · la más nueva primero | quité el `order` del historial | Sí |
| `cliente-alta.spec.ts:137` · al crear, avisa y lleva al detalle | quité el `router.navigate` | Sí |
| `clientes-buscador.spec.ts:83` · una búsqueda nueva cancela la anterior | `switchMap` → `mergeMap` | Sí |
| `simulador.spec.ts:107` · el slider y el campo van juntos | quité el `(input)` del slider | Sí, con 3 pruebas más |
| `simulador-guardar.spec.ts:82` · envía solo los cuatro campos | añadí `pais` al cuerpo | Sí |

Además probé tres mutaciones dirigidas que **no** hicieron fallar ninguna prueba (hallazgos 2 y 3) y una de control (cambiar el tope del tramo 2 de 50 a 49), que hizo fallar 8. Los puntos fuertes de las pruebas: comparan el error entero con `toEqual`, así que no se puede colar ninguna clave; el historial usa fechas que no siguen el orden de los `id`; la carrera del índice único se prueba con un `spy`; y el frontend usa reloj falso para los 250 ms y los 300 ms. No he visto pruebas que solo comprueben aciertos: casi todos los `it.each` incluyen casos que se rechazan.

### 5. Arquitectura y reglas de CLAUDE.md

- **Capas:** en el backend, routes → validators/controllers → services/models → utils/data, y ningún import va en sentido contrario. En el frontend, los servicios solo importan `base-http`, `interfaces`, `environments` y `shared` (lo de `shared` está apuntado en decisiones). No hay `HttpClient` en ningún componente.
- **Tamaños:** el fichero más largo tiene 185 líneas y la función más larga del código, 27. Las pruebas, ver hallazgo 9.
- **`any` y `console.log`:** no aparecen.
- **Precios:** solo `services/precios.service.ts` calcula tramos, base, impuesto y total. El frontend solo suma líneas ya convertidas, que es lo que pide §5. `TRAMOS` del frontend no se usa: existe solo por la regla de las constantes gemelas.
- **Constantes gemelas:** idénticas en valores y las dos con su comentario.
- **Estilos:** ni `mat-card`, ni `mat-button`, ni `mat-icon`. Los `.css` de los componentes tienen una línea cada uno.
- **Prohibiciones:** no hay `try/catch` en los controladores, `Modelo.create(req.body)` ni `body()` directo en los validadores.

### 6. Frontend

- **Suscripciones:** todas llevan `takeUntilDestroyed` o pasan por `toSignal`.
- **Peticiones canceladas:** el buscador y el detalle usan `switchMap`. El simulador usa `switchMap` y además `takeUntil(valueChanges)`, para cancelar en cuanto el valor cambia sin esperar los 250 ms. Guardar y dar de alta frenan el doble clic.
- **Estados de carga, vacío y error en cada pantalla:**

  | Pantalla | Cargando | Vacío | Error |
  | -------- | -------- | ----- | ----- |
  | Buscador | sí | «No hay resultados» | sí |
  | Detalle | sí, el cliente y el historial por separado | «Todavía no hay simulaciones guardadas» | sí, uno por petición |
  | Simulador | «Calculando…» y, después, el precio atenuado con «calculando» | no aplica | sí, y quita el precio anterior |
  | Alta | «Guardando…» | no aplica | junto al campo o un mensaje general |
  | Divisas | «Cargando divisas…» | no aplica | aviso y sigue en euros |

- **Accesibilidad:** todos los campos tienen `mat-label` o `aria-label` (el slider y el selector de divisa incluidos). Los errores van con `role="alert"` y los estados con `role="status"`. Hay `:focus-visible` global con contorno. `lang="es"`. Las animaciones van con `motion-safe:`. Lo que falta: ver el hallazgo 10.

### 7. Coherencia entre la spec y el código

Todo lo de §4, §5, §6 y §9 que repasé está hecho: buscador a 300 ms, slider de 1 a 200 con campo de 1 a 100 000, precio por usuario en euros, «calculando en euros» en el simulador y en el historial, espera de 5 s a la API de divisas, atribución con `target="_blank"` y `rel="noopener"`, y datos de ejemplo idempotentes. Las diferencias que encontré son los hallazgos 1, 4, 5 y 7. No he encontrado nada que el código haga y la spec no pida.

## Lo que está bien hecho

- **Un solo sitio para cada regla.** `TRAMOS` se recorre con `filter` y `map` sin un `if` por tramo, y el barrido de 500 000 casos sale exacto.
- **Identificador fiscal.** `identificadorFiscal.ts` son funciones puras de 62 líneas que coinciden con la spec en 1,19 millones de casos. Las tres listas de letras del CIF son tal cual las de la spec.
- **`campoDelCuerpo`.** Rechaza listas y objetos antes de cualquier sanitizer y cierra un fallo real (`usuarios: []` daba 0 €). Está documentado en `docs/decisiones.md`.
- **Buscador.** El `LIKE … ESCAPE` con un literal fijo y `replacements`, más la columna `nombre_busqueda` para las tildes y la ñ, está razonado y probado (tildes, ñ, `%`, `_`, 50 como máximo y orden).
- **Errores siempre con la misma forma.** `traducirError` convierte en 400 los cuerpos ilegibles, las URL mal codificadas y el JSON roto, en lugar de dejar un 500.
- **Simulador.** El precio anterior se queda atenuado, se borra si el cálculo falla o el valor no vale, y no se puede guardar sin un precio vigente. El error se recoge dentro del `switchMap`, así que el flujo no se corta.
- **Conversión de divisa.** `ImportePipe` recibe las líneas y no el total, así que el total que se ve siempre cuadra con sus líneas (§5).
- **Decisiones documentadas.** Cada vez que el código se aparta de la skill hay una entrada en `docs/decisiones.md` que explica por qué, y el código lo cumple.

## Lo que no he podido comprobar

- **El navegador:** cómo se ve, el responsive, las animaciones, el contraste de colores, el teclado de verdad (Tab y flechas en el slider y en los select) y un lector de pantalla. Solo he leído el código y he ejecutado las pruebas con TestBed.
- **La API de divisas real** (`open.er-api.com`): solo con las respuestas simuladas de las pruebas. No he hecho peticiones fuera.
- **Una carrera real de dos altas a la vez:** solo con el `spy` de la prueba, no con peticiones simultáneas de verdad.
- **El algoritmo oficial de los NIF K/L/M** y si los CIF reales de la lista siguen vigentes: los escribí de memoria. Todos cuadran con el algoritmo, pero no los he contrastado con un registro oficial.
- **Un caso de redondeo del IVA:** con los precios actuales no existe ninguno (ver apartado 1).
- **`npm audit`** y el despliegue (HTTPS, proxy): fuera de lo revisado.

### Cómo repetir las comprobaciones

Usé scripts de un solo uso, sin guardarlos en el repositorio. Se ejecutan con `npx tsx` desde `backend/` y `DB_ALMACEN=":memory:"`:
(1) referencia de tramos, IVA e identificador comparada con `calcularPrecio` y `esIdentificadorValido`;
(2) la API levantada en un puerto libre con `app.listen(0)`, con las peticiones de los apartados 2 y 3;
(3) `crearDatosEjemplo()` 20 veces, comparando el orden del historial con el de los `id`;
(4) medición de líneas con el AST de `typescript`;
(5) cada mutación: copia del fichero, cambio, `npm test` o `ng test`, y restaurar la copia.
