# Pendientes

Casos vistos que el plan no cubre. Están anotados, no implementados.

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
90. **Precio por usuario convertido:** multiplicado por los usuarios puede no dar el subtotal convertido
    del tramo.
91. **Medio céntimo:** el redondeo usa coma flotante, y un medio exacto puede bajar (100 céntimos a un
    cambio de 1,005 dan 100, no 101).
92. **Símbolo de la divisa:** sale el de Angular en `es-ES`: «€», «US$» y «GBP» (no «$» ni «£»).

### Para bloques siguientes

93. **`Id` es un número:** el `:id` de la ruta llega como texto. F6 tiene que convertirlo y decidir qué se
    ve con `/customers/abc`.

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

121. **Rutas sin pantalla:** las tarjetas van a `/clientes/:id` y el botón a `/clientes/nuevo`, que hoy
     muestran «Esta página no existe». F5 y F6 tienen que crearlas, con `nuevo` antes que `:id`.
