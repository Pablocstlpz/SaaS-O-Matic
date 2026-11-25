# Pendientes

Casos vistos que el plan no cubre. Están anotados, no implementados.

## Resumen: los 10 más importantes

| Nº              | Pendiente                                                                                   | Clasificación       | Motivo                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 139, 89, 161    | En otra divisa, el simulador y el historial (y el % del impuesto) pueden diferir un céntimo | limitación aceptada | La spec (§5) dice que la conversión es informativa. En euros coinciden siempre                  |
| 91              | Al convertir, un medio céntimo exacto puede redondear hacia abajo (coma flotante)          | limitación aceptada | Solo toca la conversión al pintar. Lo que se guarda y se calcula va en céntimos enteros de euro |
| 26              | El mismo identificador en dos países da 409                                                 | limitación aceptada | La spec (§2) pide identificador único, sin mencionar el país                                    |
| 86              | Ninguna prueba compara las constantes gemelas del backend y del frontend                    | mejora              | Si una cambia sin la otra, el formulario y la API dejan de coincidir sin aviso                  |
| 49              | Orden del buscador: «Ábaco» sale detrás de «Zeta»                                           | mejora              | El orden es binario; la spec solo dice «ordenada por nombre»                                    |
| 52, 53          | `q` no quita espacios de los extremos ni signos: `a-588` no encuentra `A588185`             | mejora              | El identificador se guarda normalizado, pero lo buscado no se normaliza                         |
| 114             | El buscador no avisa de que puede haber más de 50 clientes                                  | mejora              | El tope de 50 es de la spec (§4); lo que falta es decirlo en pantalla                           |
| 103, 109, 122, 148 | Sin botón de reintentar tras un error: hay que recargar o volver a escribir              | limitación aceptada | Decidido en `docs/decisiones.md` (buscador y detalle)                                           |
| 65, 67          | Datos de ejemplo sin transacción ni control de dos ejecuciones a la vez                     | limitación aceptada | El script se lanza a mano sobre una BD vacía; relanzarlo se salta lo que ya existe              |
| 129             | El historial sale entero, sin paginar                                                       | fuera de alcance    | La spec no pide paginar el historial                                                            |

El resto, tal cual (los diez de la tabla siguen abajo, en su bloque, con el detalle):

## B2 · Identificador fiscal

Código: `backend/src/utils/identificadorFiscal.ts`.

### Sin prueba

1. **NIE con Z:** se prueban X e Y.
2. **Resto de letras del CIF:** de control número solo se prueba A (no B, E, H), y de control letra
   solo Q (no P, R, S, N, W).
3. **C D F G J U V con una letra de control equivocada:** el rechazo solo se prueba con C y un número
   equivocado (`C58818502`).
4. **Inicial fuera de las tres listas** (I, K, L, M, O…): se rechaza, porque la spec no le da regla.
5. **CIF con dígito de control 0** (`0` o `J`).
6. **Normalización:** no se prueban espacios ni tabuladores, ni se normaliza en ningún caso de fuera
   de España.

### Comportamiento por decidir

7. **Guiones largos** (`–`, `—`): no se quitan al normalizar, así que el identificador se rechaza.
8. **Letras no inglesas:** fuera de España se rechaza `Ñ`, pero `ß` e `ı` se aceptan porque al pasar a
   mayúsculas se vuelven `SS` e `I`.
9. **País en minúscula:** `"es"` se trata como extranjero y `12345678A` pasa. El validador de B5 tiene
   que rechazarlo con la lista de países.
10. **Longitud de la entrada sin normalizar:** una entrada muy larga llena de puntos pasa si lo que
    queda es válido. Solo la frena el límite de 100 KB, salvo que B5 ponga otro.

## B3 · Constantes y servicio de precios

Código: `backend/src/utils/regex.ts` y `backend/src/services/precios.service.ts`.

### Sin prueba

11. **Redondeo al céntimo:** con los tramos y los IVA de hoy el impuesto siempre sale en céntimos
    enteros, así que quitar el `Math.round` no pone roja ninguna prueba.
12. **IVA de Italia y Reino Unido:** la tabla de §7 solo prueba ES, DE y FR.
13. **País sin IVA definido:** el servicio lanza un `Error` (sería un 500). Los validadores tienen
    que rechazarlo antes.

### Comportamiento por decidir

14. **Usuarios fuera de rango:** el servicio no los valida (con 0 devuelve 0 € y acepta decimales o
    más de 100.000). B4 los frena en el validador; quien llame al servicio sin validador, no.
15. **Tramos sin usuarios en el desglose:** ni la spec ni el plan lo dicen. Solo salen los tramos
    con usuarios (15 usuarios → dos líneas).

## B4 · `POST /simulations/calcular`

Código: `backend/src/validators/` y `backend/src/controllers/simulaciones.controller.ts`.
Los comportamientos 16 y 17 se han comprobado a mano contra la app.

### Comportamiento por decidir

16. **Números como texto:** `"15"`, `"015"` y `"+15"` se aceptan como 15.
17. **Campos de más** (por ejemplo, `total_centimos`): se ignoran sin avisar.

### Sin prueba

18. **Campo ausente o `null`:** los textos «Los usuarios son obligatorios» y «El país es obligatorio».
19. **Los dos campos mal a la vez:** `errors` con los dos y `message` con el primero.
20. **Límites que sí valen:** 1 y 100.000 usuarios por la API.
21. **Texto de repuesto** de `_handle.ts` para una regla sin mensaje: hoy todas lo tienen.
22. **Objeto como valor** (`{}`): la regla común lo rechaza, pero las pruebas solo envían listas.

### Para bloques siguientes

23. **Resuelto en B7.** Parámetros de la URL como lista: `?q=a&q=b` es 400 en `q`
    (`campoDeLaConsulta`).

## B5 · Clientes: modelo y `POST /customers`

Código: `backend/src/validators/clientes.validator.ts`, `backend/src/controllers/clientes.controller.ts`
y `backend/src/models/cliente.model.ts`.
Se han comprobado a mano contra la app: de 25 a 28, el 30 (con `es`), el 31 (con un número en el
nombre y con el cuerpo `{}`) y el 37 (sin identificador).

### Comportamiento por decidir

25. **Partes largas del email:** el único tope son los 254 en total. Se aceptan más de 64 caracteres
    antes de la `@` (y trozos del dominio de más de 63). El validador de email de Angular rechaza lo
    primero, así que F5 no coincidiría.
26. **Mismo identificador en países distintos:** 409. La unicidad no mira el país.
27. **Tabuladores y saltos de línea en el nombre:** se convierten en un espacio.
28. **Plan en mayúsculas** (`PRO`): se rechaza.
29. **Longitud sin normalizar (ver 10):** B5 no pone otro límite en nombre, identificador ni email;
    solo se mide lo que queda tras limpiar.
37. **País fuera de la lista sin identificador** (o que no es texto): salen los dos errores, porque
    que falte no depende del país.

### Sin prueba

30. **País en minúscula (ver 9):** la lista lo rechaza, pero la prueba usa `PT`.
31. **Campo ausente, `null` o que no es texto:** los textos «es obligatorio» de clientes y el 400 de un
    número en nombre, identificador o email.
32. **Normalización:** la prueba del 201 comprueba todo a la vez; solo se han roto dos pasos del email
    (minúscula y espacios de los extremos).
33. **Formato del email:** no se prueba un email mal formado de longitud correcta.
34. **Límites que sí valen:** nombre de 2 y de 120 caracteres y email de 254.
35. **Identificador fiscal por la API:** no se prueba un cliente de fuera de España ni un duplicado
    escrito de otra forma (`a-58.818.501` frente a `A58818501`).
36. **Listas y objetos** en los campos de cliente: los frena `campoDelCuerpo`, probado solo en B4.

## B6 · Simulaciones: modelo y `POST /simulations`

Código: `backend/src/models/`, `backend/src/validators/simulaciones.validator.ts` y
`backend/src/controllers/simulaciones.controller.ts`.
Se han comprobado a mano contra la app: del 38 al 40, el 41 (con el cuerpo `{}`, con todo a `null` y,
en `cliente_id`, con lista y objeto), el 42 (con 0), el 43, el 44 (sin `llamadas_api`) y del 45 al 47.

### Comportamiento por decidir

38. **`cliente_id` 0 o negativo:** pasa el validador, que solo pide un entero, y sale
    `REFERENCIA_INVALIDA` («El cliente no existe»).
39. **`cliente_id` enorme:** desde B7, lo que pasa de `Number.MAX_SAFE_INTEGER` (`1e20`, `1e30`) da
    «debe ser un número entero»; por debajo, «El cliente no existe».
40. **Números como texto y campos de más (ver 16 y 17):** igual al guardar. Los importes, el %, el
    `id` y la `fecha_creacion` que lleguen en el cuerpo se ignoran.

### Sin prueba

41. **Campo ausente, `null`, lista u objeto:** los textos «es obligatorio» de `cliente_id`,
    `almacenamiento_gb` y `llamadas_api`, y el «debe ser» de `cliente_id`.
42. **Usuarios al guardar:** el rango solo se prueba en `/simulations/calcular` (comparten regla).
43. **Límites que sí valen:** 0 y 1.000.000 GB, y 0 y 1.000.000.000 llamadas.
44. **Decimales:** no se prueban en `cliente_id`, `almacenamiento_gb` ni `llamadas_api`.
45. **Sin edición:** ninguna prueba comprueba que `PUT`, `PATCH` o `DELETE /simulations/:id` dan 404.
46. **Campos de más:** de lo que se ignora en el cuerpo, solo se prueba `pais`.
47. **Clave ajena:** la BD impide borrar un cliente con simulaciones (`RESTRICT`); sin prueba.

## B7 · Lecturas: buscador, detalle e historial

Código: `backend/src/controllers/clientes.controller.ts`,
`backend/src/validators/clientes.validator.ts`, `backend/src/models/cliente.model.ts` y
`backend/src/app.ts`.
Se han comprobado a mano contra la app: del 49 al 55, el 57 (una barra invertida) y el 58 (la forma
de una simulación). Del 49, la parte de las mayúsculas tiene prueba.

### Resueltos en B7, con prueba

48. **Mayúsculas con tilde o eñe:** `q=érica` encuentra «IBÉRICA SUR» (columna `nombre_busqueda`).
50. **Carácter nulo en `q`:** daba 500; es 400.
51. **Longitud de `q`:** como mucho 120 caracteres.
60. **Id de cientos de cifras:** `id` y `cliente_id` daban 500; son 400.
61. **Ruta mal codificada** (`/customers/%`): daba 500; es 400.
62. **Cuerpo comprimido y corrupto** (pendiente desde B1): daba 500; es 400.
63. **Carácter nulo en el nombre:** se guardaba y el buscador no veía lo de detrás; es 400.

### Comportamiento por decidir

49. **Orden de tildes y eñe:** la lista ya no distingue mayúsculas (resuelto en B7), pero el orden
    sigue siendo el binario: las letras con tilde y la eñe van detrás de la z («Ábaco» detrás de
    «Zeta»).
52. **Identificador escrito con signos:** `q` no se normaliza, así que `a-588` no encuentra `A588185`.
53. **Espacios en `q`:** no se quitan los de los extremos; `q= zeta ` no encuentra «zeta».
54. **Otros parámetros:** se ignoran, también `q[]=zeta`, que devuelve la lista sin filtrar.
55. **`id` raro:** 0, negativo o mayor que el último dan 404; `01` vale como 1; `1.5`, `1e30` y los que
    pasan de `Number.MAX_SAFE_INTEGER` dan 400.
56. **Empates:** dos clientes con el mismo nombre (aunque cambien las mayúsculas), o dos simulaciones
    con la misma fecha, no tienen un orden fijado.
64. **Equivalencias de letras:** `ss` no encuentra `ß`, y una tilde escrita como carácter aparte
    (texto sin normalizar) no coincide con la letra acentuada.

### Sin prueba

57. **Barra invertida:** no hay prueba de buscarla.
58. **Campos del historial:** la prueba mira cuáles salen y en qué orden, no la forma completa.
59. **Listas en la consulta:** `campoDeLaConsulta` solo se prueba con `q`.

## B8 · Datos de ejemplo

Código: `backend/scripts/datos-ejemplo.ts`.
Se han comprobado a mano: el 68 y el 69, lanzando `npm run datos-ejemplo` dos veces contra una BD
temporal vacía.

### Comportamiento por decidir

65. **Ejecución interrumpida:** si falla entre el cliente y sus simulaciones, queda con menos de las
    previstas, y al relanzar se salta porque ya existe. No hay transacción.
66. **Identificador de ejemplo ya usado:** un cliente creado a mano con ese identificador (aunque sea
    otro nombre u otro país) se salta, y puede no quedar un cliente de ejemplo por país.
67. **Dos escrituras a la vez:** el script lanzado dos veces a la vez, o con la API guardando datos.

### Sin prueba

68. **El comando:** las pruebas llaman a la función; no cubren la entrada de `package.json`, la
    condición que la ejecuta desde la consola ni el cierre de la BD.
69. **Clave ajena:** que el script cree las tablas con la relación depende de que importe
    `associations.ts`.
70. **Datos sin validador:** el script escribe con los modelos. No se prueba que el identificador, el
    email y el nombre queden normalizados (la validación de B2 normaliza antes de mirar) ni que los
    usuarios, el almacenamiento y las llamadas estén dentro de los límites.
71. **BD con parte de los clientes:** solo se prueba relanzarlo con los cinco ya creados.

## F1 · Esqueleto del frontend y aspecto base

Código: `frontend/`.
Se han comprobado a mano en Edge sin ventana, con `ng serve`: el 73 (con «Volver al inicio»), el 75 y
el 76 (a 320, 375 y 1366 px).

### Sin prueba

72. **Formato español:** quitar `LOCALE_ID` o `registerLocaleData` no pone roja ninguna prueba.
73. **Página no encontrada:** ni la ruta desconocida ni su enlace de vuelta tienen prueba.
74. **`app-cargando`:** desde F4 lo usa el buscador, con prueba de que sale el spinner y visto en el navegador.
75. **Aspecto:** los colores del tema, la letra y que no se pida nada fuera de la app.
76. **Móvil y escritorio:** la cabecera y el contenido sin desplazamiento horizontal.

### Comportamiento por decidir

77. **Título de la pestaña:** es «SaaS-O-Matic» en todas las pantallas.
78. **Icono de la pestaña:** sigue el `favicon.ico` de la plantilla.
79. **Otros alfabetos:** la fuente solo trae latín y latín extendido; un nombre en griego o cirílico sale
    con la letra del sistema.

### Para bloques siguientes

80. **Resuelto en F4.** Inicio vacío: `/` es el buscador.

## F2 · Contrato y conversión de divisas

Código: `frontend/src/app/` (`shared/`, `interfaces/`, `services/` y `pipes/`).
Se han comprobado a mano, con una prueba temporal que no se ha guardado: del 81 al 84 (del 82, solo que
los dos textos salen; no las duraciones). El 86, comparando los dos ficheros con un script.

### Sin prueba

81. **Pipe `importe`:** ni el formato en cada divisa ni que el total de varias líneas sea la suma de las
    convertidas (la prueba mira `shared/divisas.ts`, no el pipe).
82. **`NotificacionesService`:** ni los avisos, ni su duración, ni el botón «Cerrar».
83. **Errores sin la forma de la API:** sin respuesta (`status` 0), un cuerpo que no es JSON o está vacío,
    y elementos mal formados en `errors`, que se descartan.
84. **Buscar con texto:** la prueba de `listar` no lleva `q`, así que no se prueba que se envíe codificado
    (`&`, `%`, `+`, `#`, tildes).
85. **Cuerpo de los POST:** se prueban la ruta y el verbo, no lo que se envía.
86. **Constantes gemelas:** ninguna prueba compara `shared/regex.ts` con el del backend.
87. **Contrato:** las interfaces no se comprueban contra la API real.

### Comportamiento por decidir

88. **Textos que no fija la spec:** «No se puede conectar con el servidor», «Error inesperado» y «Cerrar»
    son los de la plantilla de la skill.
89. **Qué es una «línea» al convertir:** el cálculo trae los tramos y el historial no. Si en el simulador
    la base es la suma de los tramos convertidos y en el historial es la base convertida, la misma
    simulación puede diferir en algún céntimo. F6 y F7 tienen que usar las mismas líneas.
90. **Resuelto en F7, con prueba** (spec §5). El precio por usuario se queda en euros y solo se convierten
    los importes: «40 usuarios × 8,00 € → 350,70 US$».
91. **Medio céntimo:** el redondeo usa coma flotante, y un medio exacto puede bajar (100 céntimos a un
    cambio de 1,005 dan 100, no 101).
92. **Símbolo de la divisa:** sale el de Angular en `es-ES`: «€», «US$» y «GBP» (no «$» ni «£»).

### Para bloques siguientes

93. **Resuelto en F6.** `:id` de la ruta: se convierte con `numberAttribute`. Lo que no es un número
    llega a la API como `NaN` y se pinta su 400 («El cliente debe ser un número entero»).

## F3 · Servicio y selector de divisa

Código: `frontend/src/app/services/divisas.service.ts`,
`frontend/src/app/components/compartidos/selector-divisa/` y `frontend/src/app/components/layout/`.
Se han comprobado a mano en Edge sin ventana, con `ng serve`: el 97, el 99 (ni `localStorage` ni
`sessionStorage`), el 100 (el selector y el pie, en el inicio y en la página no encontrada, a 320, 375
y 1366 px), del 102 solo que el selector no se abre y el 105 (la divisa vuelve a EUR). El 97 se probó
antes de los cambios de la revisión.

### Resueltos en la revisión de F3, con prueba

101. **Mientras carga:** el selector dice «Cargando divisas…» en lugar del desplegable.
106. **Atribución:** la API sin clave la exige. El pie cita a ExchangeRate-API con su enlace.
107. **Enlace del pie:** se abre en una pestaña nueva, así la app no se recarga.

### Sin prueba

94. **Respuesta sin tipos válidos** (`result: "error"`, sin `rates`, sin USD o GBP, o con un cambio
    que no es un número positivo): cuenta como API caída.
95. **GBP y vuelta a EUR:** la prueba solo elige USD.
96. **Sin conexión** (`status` 0): la prueba de API caída usa un 500.
97. **Teclado:** foco visible en el selector y cambio de divisa con las flechas.
98. **Resuelto con el 101:** durante la espera ya no hay desplegable, solo el texto.
99. **Sin guardar:** ninguna prueba impide usar `localStorage` o `sessionStorage`.
100. **Visible en todas las pantallas:** las pruebas montan el layout, no recorren las rutas.

### Comportamiento por decidir

102. **Después del aviso:** desaparece a los 8 s (o con «Cerrar») y el selector queda deshabilitado sin
     explicar por qué.
103. **Sin reintento:** si fallan los tipos, solo recargar la página los vuelve a pedir.
104. **Otros avisos:** solo hay un snackbar; un aviso posterior sustituye al de los tipos.
105. **Divisa elegida:** al recargar se vuelve a EUR.
108. **Aviso sobre el pie:** el snackbar sale abajo y, en pantallas cortas o estrechas, puede tapar la
     atribución mientras se ve.

## F4 · Buscador y dashboard

Código: `frontend/src/app/components/clientes/` y `frontend/src/app/app.routes.ts`.
Se han comprobado a mano en Edge sin ventana, con `ng serve` y los datos de ejemplo, a 320, 375 y
1366 px: el 110, el 111, el 117, el 118, el 119 (también con el teclado) y el 120.

### Comportamiento por decidir

109. **Sin reintento:** tras un error hay que escribir otra vez o recargar (ver `docs/decisiones.md`).
110. **Más de 120 caracteres:** el campo no tiene tope; la API responde 400 y se pinta su mensaje.
111. **Volver al buscador:** desde otra pantalla el campo sale vacío; el texto no va en la URL.
112. **Mientras se teclea:** durante los 300 ms se ven los resultados anteriores, y en cada búsqueda el
     spinner sustituye a las tarjetas.
113. **Peticiones de más:** si el texto se cambia y se deshace en menos de 300 ms, se vuelve a pedir lo
     mismo. Un texto de solo espacios se envía como búsqueda (ver 53).
114. **Tope de 50:** la pantalla no avisa de que puede haber más clientes.
115. **Textos que no fija la spec:** «Clientes», «Buscar por nombre o identificador», «Dar de alta un
     cliente», «Cargando…» y «Plan pro» (el plan sale tal cual llega).
116. **Datos de la tarjeta:** nombre, identificador, país y plan; ni email ni fecha.

### Sin prueba

117. **Contenido de la tarjeta:** las pruebas solo miran el nombre.
118. **Buscar después de un error:** sacar el `catchError` del `switchMap` no pone roja ninguna prueba.
119. **Enlaces:** ni el de cada tarjeta ni el botón de alta.
120. **Vaciar el campo:** que vuelve a pedir sin `q`.

### Para bloques siguientes

121. **Resuelto en F5, sin prueba (ver 119 y 179):** `/clientes/nuevo` va antes que `:id` en
     `app.routes.ts`, y el botón de alta lleva al formulario. Visto en el navegador a 320 y 1366 px.

## F5 · Alta de cliente

Código: `frontend/src/app/components/clientes/cliente-alta/`, `cliente-formulario/` y
`frontend/src/app/app.routes.ts`.
Se han comprobado a mano en Chromium sin ventana (el de Playwright), con `ng serve`, el backend y los
datos de ejemplo. A 320 px, con toques: el botón de alta del buscador lleva a `/clientes/nuevo`, aviso en
vivo del nombre, país y plan obligatorios al enviar vacío, `12345678A` pasa el formulario y el 400 sale
junto al identificador. A 1366 px, con ratón: alta de `00000000-t` (aviso y detalle del cliente nuevo) y
409 junto al identificador al repetirlo. Sin desplazamiento horizontal y sin errores en consola, aparte
de los 400 y 409 provocados. En la BD local queda el cliente «Prueba Alta F5».
Después se ha añadido `items-start` a la rejilla (a 1366 px, la caja del país se estiraba a la altura
del identificador con su aviso), y eso no se ha vuelto a ver en el navegador.

### Comportamiento por decidir

163. **Valores de entrada:** todo vacío; país y plan empiezan sin elegir.
164. **Cuándo avisa:** al escribir en el campo o al enviar. Lo que no se ha tocado no avisa hasta enviar.
165. **Campo vacío:** el formulario dice «es obligatorio»; la API, a un texto vacío, le responde con
     el «debe ser» (nunca llega, porque el formulario no lo envía).
166. **Email:** el formulario pide `algo@algo.algo`, sin espacios y de 254 como mucho. El `isEmail` del
     servidor es más estricto (por ejemplo, más de 64 caracteres antes de la @) y eso vuelve como 400
     junto al campo.
167. **Identificador en España:** el formulario acepta cualquier letra inicial (`[A-Z]` + 7 números +
     control). Las que no son de CIF, NIE ni DNI las rechaza el servidor.
168. **Carácter nulo en el nombre:** el formulario no lo frena; vuelve como 400 junto al campo.
169. **Error del servidor junto a un campo:** bloquea el envío hasta que se cambie ese campo. Cambiar el
     país también borra el del identificador, porque lo vuelve a validar (como 147).
170. **Un error con campo que el formulario no tiene** no se pintaría en ningún sitio. Hoy la API de
     alta solo devuelve errores de sus cinco campos.
171. **Se envía lo escrito:** el formulario valida el texto limpio, pero envía el original y la API lo
     limpia.
172. **Sin cancelar:** no hay enlace de vuelta; se vuelve con el logo o con «Atrás» (como 125).
173. **Textos que no fija la spec:** «Dar de alta un cliente» (título), las etiquetas, «Dar de alta»,
     «Guardando…» y «Cliente dado de alta». El plan sale tal cual («pro»).

### Sin prueba

174. **País y plan:** el «es obligatorio» al enviar sin elegirlos.
175. **No se envía con un campo inválido** (lo pide el «Terminado» del plan, pero no sus pruebas), ni
     dos veces seguidas mientras se envía.
176. **Cambio de país:** que vuelve a validar el identificador. Del formato español solo se prueba
     `12345678A`; ni NIE ni CIF.
177. **Limpieza antes de validar:** espacios dobles en el nombre, ni `a-58.818.501` en el identificador.
178. **Errores sin campo** (500, sin conexión, 409 `DUPLICADO`): que salen bajo el formulario.
179. **Ruta:** que `clientes/nuevo` va antes que `clientes/:id`, ni el botón de alta (ver 119).
180. **«Guardando…»** y el botón desactivado mientras se envía.
181. **Formato del email:** las pruebas solo miran su longitud.

## F6 · Detalle del cliente e historial

Código: `frontend/src/app/components/clientes/cliente-detalle/` y `cliente-datos/`,
`frontend/src/app/components/simulaciones/historial-simulaciones/` y `frontend/src/app/app.routes.ts`.
Se han comprobado a mano en Edge sin ventana, con `ng serve` y los datos de ejemplo, a 375 y 1366 px,
con un cliente (el alemán) y con `/clientes/999`: se entra desde la tarjeta del buscador, se ven los
datos y el historial, el cambio a USD no pide nada al backend y no hay desplazamiento horizontal. Con
eso queda visto el 131.

### Comportamiento por decidir

122. **Sin reintento:** tras un error solo queda recargar la página (ver `docs/decisiones.md`).
123. **Falla solo el cliente:** se ve su error y se oculta el historial, aunque haya llegado bien.
124. **Falla solo el historial:** el cliente se ve y el error sale bajo «Historial de simulaciones».
125. **Volver al buscador:** la pantalla no tiene enlace propio; se vuelve con el logo o con «Atrás».
126. **Ids raros:** `/clientes/0x10` se convierte en 16 antes de llegar a la API.
127. **Textos que no fija la spec:** «Historial de simulaciones», «Todavía no hay simulaciones
     guardadas», las etiquetas de los datos y de cada simulación, y el plan tal cual llega («pro»).
128. **Fechas:** la del cliente sin hora; la de cada simulación, corta y con hora, en la zona del
     navegador. Dos guardadas en el mismo minuto se ven con la misma fecha.
129. **Historial largo:** salen todas las simulaciones, sin paginar.
130. **Título de la pestaña (ver 77):** no cambia con el nombre del cliente.

### Sin prueba

131. **Ruta:** ninguna prueba cubre `clientes/:id` en `app.routes.ts` ni que el id llegue desde ella.
132. **Cargando:** ni el spinner del cliente ni el del historial.
133. **Errores:** un fallo que no sea el 404, o de una sola de las dos peticiones.
134. **Cambio de id** sin salir de la pantalla, y cancelación de las peticiones anteriores.
135. **Contenido de cada simulación:** de lo que no es dinero solo se miran los usuarios; ni la fecha,
     ni el almacenamiento, ni las llamadas, ni el % del impuesto.
136. **Total en divisa:** que sea la suma de las líneas convertidas (ver 81); en la prueba, convertir
     el total de golpe daría lo mismo.
137. **GBP** y la vuelta a EUR en esta pantalla.

### Para bloques siguientes

138. **Resuelto en F7, con prueba** (spec §5). En el simulador la base convertida es la suma de los
     tramos convertidos y el total, esa base más el impuesto convertido. Ver 139.

## F7 · Simulador: slider, cálculo en vivo y guardar

Código: `frontend/src/app/components/simulaciones/simulador/` y `desglose-precio/`, y
`frontend/src/app/components/clientes/cliente-detalle/`.
Se han comprobado a mano en Edge sin ventana, con `ng serve` y los datos de ejemplo, una pasada a
375 px (con toques) y otra a 1366 px (con ratón), con el cliente alemán: arrastrar el slider (una
petición), «calculando», 500 usuarios, 100.001 y campo vacío (sin peticiones, y el precio desaparece),
el cambio a USD (sin peticiones y las sumas cuadran), guardar (la primera del historial), sin errores en
consola ni desplazamiento horizontal. Con eso quedan vistos el 143, el 157 y el 160.
Tras la revisión, a 320 y 1366 px: la pista del slider, la tarifa en euros y el botón desactivado al
calcular y con el cálculo bloqueado; a 320 y 375 px, que el campo de usuarios cabe en la tarjeta.

### Comportamiento por decidir

139. **Resuelto en la spec (§5):** en otra divisa, el simulador y el historial pueden diferir en algún
     céntimo, porque la conversión es informativa. En euros coinciden siempre.
140. **Valores de entrada:** 1 usuario, 0 GB y 0 llamadas, y se calcula al entrar. Se puede guardar sin
     tocar nada.
141. **Resuelto en F7, con prueba** (spec §5). El botón está desactivado mientras calcula y si el cálculo
     ha fallado.
142. **«Dos veces seguidas»:** se bloquea mientras la petición está en vuelo. Después, otro clic guarda
     otra simulación igual.
143. **Usuarios no válidos:** el precio desaparece y su hueco queda vacío.
144. **Texto que no es un número** (por ejemplo, `e`): el navegador entrega el campo vacío y sale «es
     obligatorio».
145. **Sin aviso al guardar:** la simulación solo aparece en el historial.
146. **Error al guardar que no es de un campo** (500, sin conexión, `cliente_id`): sale bajo el botón y
     se queda hasta el siguiente intento.
147. **Error del servidor junto a un campo:** bloquea el botón hasta que se cambie ese campo.
148. **Fallo del cálculo:** no hay reintento y no se puede guardar; hay que cambiar los usuarios o
     recargar.
149. **Guardar con el historial sin cargar:** si aún no ha llegado o ha fallado, la guardada no se
     añade. La respuesta pendiente puede no traerla.
150. **Salir mientras guarda:** el navegador cancela la petición, pero el servidor puede haberla
     guardado.
151. **Textos que no fija la spec:** «Simulador», «Usuarios activos», «Usuarios del 1 al 10», «en
     adelante», «Almacenamiento (GB)», «Llamadas a la API», «Guardar simulación», «Calculando…» y
     «Guardando…».
152. **Slider en pantalla estrecha:** mide unos 145 px a 375 y 112 a 320 para 200 valores, y el aviso del
     campo de usuarios ocupa cuatro o cinco líneas.
153. **Resuelto en F7:** la parte sin recorrer del slider se ve (`material-theme.scss`).
161. **Resuelto:** en otra divisa se lee «Impuesto (19 %, calculado en euros)» (spec §5). **Porcentaje del impuesto en otra divisa:** el impuesto se convierte (spec §5), así que el % de la
     base convertida puede diferir en un céntimo del impuesto que se ve. Con 1 € = 1,096 US$, España y
     17 usuarios: base 170,98, impuesto 35,90, y el 21 % de 170,98 es 35,91. También en el historial.

### Sin prueba

154. **Almacenamiento y llamadas:** que no piden cálculo ni cambian el precio; tampoco sus límites ni sus
     avisos.
155. **400 del cálculo:** ninguna prueba lo pinta junto a su campo (la del 400 es la de guardar).
156. **Errores al guardar** que no son de un campo, y volver a guardar después de uno.
157. **Precio con un valor no válido:** ninguna prueba mira que desaparezca.
158. **Slider:** que al soltar no repite la petición, y el clic sobre la pista (`valueChange`).
159. **Spinners** «Calculando…» y «Guardando…».
160. **Divisa en el simulador:** que cambiarla vuelve a pintar el desglose sin pedir nada.
162. **Aspecto:** ni el color de la pista del slider ni que el campo de usuarios quepa a 320 px.

## Auditoría de código (`04-calidad/auditoria-codigo.md`)

Hallazgos que se dejan sin arreglar. Siguen sin implementar.

- **Hallazgo 4:** los NIF K, L y M (personas físicas sin DNI ni NIE) se rechazan siempre. Hueco de la spec: hay que preguntar a negocio si se admiten y con qué algoritmo.
- **Hallazgo 7:** `q` no se normaliza como el identificador guardado: `A-58818` no encuentra `A58818501`. Hay que decidir si se normaliza (relacionado con 52 y 53).
- **Hallazgo 8:** lógica y textos copiados entre backend y frontend fuera de las constantes gemelas (`limpiarNombre`, `normalizarIdentificador`, formatos, mensajes), y copias dentro de cada lado (`SIN_CLIENTE`, `PAISES.find(...)`, `errorDeCampo` en las pruebas).
- **Hallazgo 10:** tras un envío fallido, el foco no va al primer campo con error. Sin comprobar con lector de pantalla.
