# Proceso

## 24/11 · Análisis y borrador

- Leí los requisitos y los resumí con mis palabras.
  -> 00-borrador/evaluacion_inicial_requisitos.md
- Revisé el borrador con Gemini y Claude. Me señalaron el redondeo de
  divisas y que el slider podía enseñar precios viejos. Lo añadí.

## 25/11 · Spec

- Escribí la spec v1 a mano.
- La IA la completó. Acepté: id propio para el cliente, códigos de país.
  -> 01-SPEC.md

  ## 25/11 · Reglas para la IA

- Pedí a Claude Code un `CLAUDE.md` basado en mi skill de arquitectura
  (`arquitectura-angular`) y en la spec, avisándole de antemano de los
  choques entre las dos.
  -> `prompts/01-crear-claude-md.md`
- Acepté sus decisiones: Vitest para las pruebas, solo castellano (sin
  ngx-translate), leer la entrada con `matchedData` en vez de `req.body` y el
  formato de error con `message`, `tipo` y `errors` siempre.
- Al revisarlo, le pedí cambios:
  -> `prompts/02-ajustar-claude-md.md`
  - Quitar un comando que no existía (`formato:comprobar`).
  - Material solo para controles; tarjetas y maquetación con Tailwind, para
    que no parezca una app genérica.
  - Además de Claude Code, que programa, usé un segundo Claude en otra
    conversación como revisor: le pasaba cada informe de bloque y me ayudaba
    a detectar huecos y decidir qué corregir. Las decisiones finales las
    tomaba yo.

* Slider: dejar el precio anterior atenuado con "calculando" en vez de
  vaciarlo, para que no parpadee.
* Versionar la skill (el `.gitignore` excluía `.claude` entero y quien
  clonara el repo no la tendría).

- La IA detectó que lo del slider contradecía la spec. Cambié primero la spec
  y después el código: la spec siempre manda.
- La IA corrigió por su cuenta una entrada de `decisiones.md` que seguía
  hablando de `mat-card`.
  - Añadí la skill `frontend-design` para el aspecto visual, dentro de lo ya
    decidido (Material para controles, Tailwind para el resto). Descarté Stitch
    para no mezclar dos fuentes de diseño.
    -> `CLAUDE.md`, `docs/decisiones.md`

## 25/11 · Definición de bloques

- Compacté la conversación con Claude Code antes de empezar: la tarea
  anterior estaba cerrada y así libero contexto.
- Pedí partir la spec en bloques pequeños, en orden de dependencias, cada uno
  con su apartado de la spec, ficheros, pruebas y cuándo está terminado.
  -> `prompts/03-plan.md`
- La IA no inventó lo que la spec no decía: me planteó 7 dudas antes de
  seguir. Consulté las opciones y respondí:
  - Buscador sin texto: los 50 primeros clientes por nombre.
  - `%` y `_` en la búsqueda: como texto literal, no como comodines.
  - API de divisas: se espera 5 s; después, euros y aviso.
  - Tipos de cambio: solo en memoria.
  - El formulario comprueba formato y longitud; la letra de control la
    valida el servidor, para no duplicar el algoritmo.
  - Slider de 1 a 200 usuarios, con un campo numérico al lado (hasta 100.000).
  - El simulador va dentro del detalle del cliente.
- Además, le pedí cambios al plan:
  -> `prompts/04-ajustar-plan.md`
  - Juntar bloques pequeños (de 19 a 17), porque el plazo es corto.
  - Importes con sufijo `_centimos`, para que nadie los lea como euros.
  - Un script de datos de ejemplo, para que la app no arranque vacía.
  - Un bloque final de auditoría, calidad y README probado en un clon limpio.
- Las respuestas entraron primero en la spec y después en el plan.
- La IA decidió por su cuenta tres detalles y los anotó en la spec; los
  acepté: un cliente de ejemplo por país, el script no duplica si se lanza
  dos veces, y con más de 200 usuarios el slider se queda al máximo.
  -> `01-SPEC.md` §6 y §9, `02-PLAN.md`

## 25/11 · Bloque B1: esqueleto del backend, errores y seguridad común

- Desde este bloque, las tareas de programación las hace Sonnet 5.5. Hasta
  ahora usaba Opus 5.5, porque sentar las bases (spec, reglas y plan) pedía
  más razonamiento. Con el plan cerrado, el trabajo es ejecutarlo.
- Pedí el bloque B1, y solo ese, partiendo de la plantilla Node de mi skill.
  -> `prompts/05-b1.md`
- Resultado: el backend arranca, responde a `/salud`, y los errores salen
  siempre con `message`, `tipo` y `errors`. Pruebas en verde y tipos sin
  errores.
- La IA rompió el código a propósito 16 veces, una cada vez, para comprobar
  que las pruebas detectan los fallos: 404, JSON mal formado, cuerpo de más
  de 100 KB, 409, 500 sin detalles internos, CORS y configuración. Todas las
  roturas pusieron alguna prueba en rojo.
- Acepté sus decisiones nuevas: configuración con valores por defecto y sin
  `.env` (quien lo pruebe arranca sin crear ficheros) y logger sin redacción de
  campos (no hay contraseñas ni tokens).
- Me planteó dos casos que la spec no cubría:
  - Juego de caracteres o compresión no admitidos: daban 500 y son un fallo
    del cliente -> 400 con "No se puede leer el cuerpo de la petición".
  - Cuerpo que no es JSON: se queda como está; los validadores darán 400 por
    los campos que falten.
- Después propuso un tercero (gzip corrupto). Lo dejé como pendiente: nadie
  lo va a enviar y cada caso extra cuesta tiempo. Desde B2, le pido que
  apunte esos casos al final de su respuesta en vez de implementarlos.
- Pendiente para la auditoría final: 2 avisos moderados de `npm audit` en una
  dependencia de Sequelize. El arreglo que propone npm baja a una versión muy
  antigua, así que no lo apliqué. Solo se ha probado con Node 24.
  -> `backend/`, `docs/decisiones.md`

## 25/11 · Bloque B2: validación del identificador fiscal

- Pedí el bloque B2 con tres normas nuevas: solo las pruebas del plan, una
  rotura por prueba y los casos extra apuntados al final, sin implementarlos.
  Así corté la tendencia a ampliar el alcance que vi en B1.
  -> `prompts/06-b2.md`
- Resultado: DNI, NIE y CIF se validan recalculando el carácter de control.
  Fuera de España, solo formato. Función pura, sin base de datos ni HTTP.
- La IA añadió un NIE falso (`X1234567A`) que faltaba en la tabla de la spec
  y planteó 11 casos que el plan no cubría.
- Al revisar las pruebas vi que las letras C D F G J U V solo se probaban
  aceptando un control correcto, nunca rechazando uno equivocado: un código que
  aceptara cualquier cosa habría pasado. Pedí tres pruebas más:
  - `C58818502` inválido (rechaza un control equivocado).
  - `Y1234567X` válido (con la X, que vale 0, un fallo al sustituir la letra
    no se notaría).
  - `A5881850A` inválido (la A exige número).
- Cada prueba nueva se rompió a propósito y se puso en rojo. 48 pruebas en verde.
- El resto de casos quedan en `pendientes.md`. Los límites de 4 y 20
  caracteres pasan a B3, para que el formulario use los mismos.
  -> `backend/src/utils/identificadorFiscal.ts`, `ai-workspace/pendientes.md`

## 25/11 · Bloque B3: constantes y servicio de precios

- Pedí el bloque B3 con las mismas normas que B2.
  -> `prompts/07-b3.md`
- Resultado: tramos, países con su IVA, planes y límites en una sola
  constante (`utils/regex.ts`), que tendrá un gemelo en el frontend. El
  servicio de precios recorre los tramos sin un `if` por tramo y trabaja
  siempre en céntimos enteros.
- Los límites del identificador de fuera de España (4 y 20) pasaron a
  `LIMITES`, como quedó pendiente en B2. Al romperlos, falló su prueba de B2.
- Acepté que el desglose solo muestre los tramos con usuarios: con 15
  usuarios no tiene sentido enseñar "0 usuarios a 5 €".
- Ninguna prueba protege el redondeo del impuesto, y es correcto: con
  precios en euros enteros y un IVA entero, el impuesto nunca tiene
  decimales. El redondeo queda para cuando un precio tenga céntimos.
- 59 pruebas en verde.
  -> `backend/src/utils/regex.ts`, `backend/src/services/precios.service.ts`

  ## 25/11 · Bloque B4: POST /simulations/calcular

- Pedí el bloque B4 con las mismas normas.
  -> `prompts/08-b4.md`
- La IA me preguntó qué texto poner en los errores, porque la spec no lo
  decía. Elegí distinguir "falta el dato" de "el dato está mal", y lo fijé
  como regla para todos los campos: "<Campo> es obligatorio" y "<Campo> debe
  ser <regla>". Así no hay que decidirlo campo a campo.
- La IA encontró un agujero que las pruebas del plan no cubrían: si
  `usuarios` o `pais` llegaban como lista, se saltaban la validación
  (`[]` daba un precio de 0 € y `["ES"]` un 500). Aunque el plan no lo
  incluía, decidí arreglarlo en este bloque: contradecía la spec y los
  bloques siguientes lo habrían heredado. Lo resolví con una regla común
  para todos los campos (`campoDelCuerpo`), no con un parche por campo.
- Para que no se salte en los bloques siguientes, lo añadí a las
  prohibiciones de `CLAUDE.md`.
- 67 pruebas en verde.
  -> `backend/src/validators/`, `docs/decisiones.md`

## 25/11 · Bloque B5: clientes y POST /customers

- Pedí el bloque B5 con esfuerzo alto: modelo, limpieza de datos,
  duplicados y la carrera entre dos altas.
  -> `prompts/09-b5.md`
- Resultado: limpia y valida, rechaza identificadores repetidos con dos 409
  (el que detecta el controlador y el que frena el índice de la base de datos)
  y guarda solo los cinco campos esperados. 11 pruebas nuevas, cada una rota
  a propósito.
- La IA sacó la regla del país a un fichero común para no repetirla entre
  clientes y simulaciones.
- Corregí tres cosas al revisar:
  - La IA quitaba los espacios de dentro del email. Eso podía guardar otra
    dirección sin avisar; ahora se rechaza. Al cambiarlo, la IA vio que el
    validador aceptaba espacios entre comillas (`"com pras"@acme.example`)
    y añadió una regla que los rechaza también.
  - El 409 decía "debe ser único", el patrón de los errores de formato. Lo
    cambié por "Ya existe un cliente con ese identificador fiscal", porque el
    dato está bien escrito: lo que pasa es que ya existe.
  - Pedí comprobar qué pasaba con un país incorrecto, y **fallaba**: el error
    salía también en el identificador, que no se puede validar sin saber el
    país. Ahora sale solo en `pais`. Ninguna prueba del plan lo cubría.
- Actualicé la spec para el email: la spec tiene que decir lo que hace el
  código.
  -> `backend/src/models/`, `validators/`, `controllers/clientes.controller.ts`

  ## 25/11 · Bloque B6: simulaciones y POST /simulations

- Pedí el bloque B6 con esfuerzo medio: lo delicado (validación común,
  país y precios) ya estaba resuelto en bloques anteriores.
  -> `prompts/10-b6.md`
- Resultado: la simulación se guarda con el resultado del servicio de precios
  y el % de impuesto aplicado, para que el historial no cambie si cambia el
  IVA. 88 pruebas en verde, cada prueba nueva rota a propósito.
- Lo más importante: el IVA sale del país del cliente guardado en la base de
  datos, no del que llegue en la petición. Una prueba manda otro país en el
  cuerpo y comprueba que se ignora: nadie puede presupuestar con el IVA de
  otro país.
- Un cliente que no existe da 400 `REFERENCIA_INVALIDA` en `cliente_id`, no
  404: lo que está mal es un dato del cuerpo, no la URL.
- La relación cliente–simulaciones impide borrar un cliente con simulaciones.
- La IA añadió una regla que nadie había pedido (`cliente_id` mayor que 0) y
  la quitó ella misma: no inventar requisitos funciona.
  -> `backend/src/models/simulacion.model.ts`, `controllers/simulaciones.controller.ts`

## 25/11 · Bloque B7: buscador, detalle e historial

- Pedí el bloque B7 con una excepción: resolver el caso de `?q=a&q=b`, el
  mismo agujero de las listas que cerré en el cuerpo en B4.
  -> `prompts/11-b7.md`
- La primera entrega decía estar terminada, pero la lista de fallos vistos
  llegó incompleta y el caso normal del detalle (200) no tenía prueba. Pedí
  la lista entera y que arreglara lo que diera 500 o chocara con la spec.
- Resultado: cuatro entradas daban 500 y ahora dan 400 (un carácter nulo en
  la búsqueda, ids con cientos de cifras, una ruta mal codificada y un cuerpo
  comprimido corrupto). Dos de ellas no estaban ni apuntadas.
- La búsqueda no encontraba "IBÉRICA" escribiendo "ibérica": SQLite solo
  ignora mayúsculas en letras sin tilde. Se arregló con una columna interna
  en minúsculas, que la API no devuelve. Las tildes siguen contando ("erica"
  no encuentra "Ibérica"); lo anoté en la spec.
- Decidí qué hacer con los casos abiertos: arreglé solo el orden alfabético
  sin distinguir mayúsculas, que era una línea. Ordenar bien las tildes y la
  ñ pedía otra columna y queda en pendientes. El resto no daba error ni
  contradecía la spec.
- La IA usó un fragmento fijo de SQL para que `%` y `_` se busquen como
  texto, apartándose de una regla de `CLAUDE.md`. Lo avisó y lo anotó: el
  texto del usuario entra como parámetro, así que no hay riesgo de inyección.
- 115 pruebas en verde.

## 25/11 · Bloque B8: datos de ejemplo

- Pedí el bloque B8 para que quien lo pruebe no se encuentre la app vacía.
  -> `prompts/12-b8.md`
- Resultado: `npm run datos-ejemplo` crea 5 clientes, uno por país, con 2 o 3
  simulaciones cada uno. Los importes los calcula el mismo servicio de
  precios que la API, y los identificadores pasan el algoritmo. Si se lanza
  dos veces, no duplica nada.
- Comprobado con el comando real sobre una base de datos vacía: 5 clientes
  la primera vez y 0 la segunda.
- 119 pruebas en verde. Con esto, el backend está terminado: los seis
  endpoints de la spec más `/salud`.

  ## 25/11 · Bloque F1: esqueleto del frontend y aspecto base

- Pedí a la IA que me propusiera la dirección visual antes de programar y
  esperara mi visto bueno.
  -> `prompts/13-f1.md`
- Propuso una "hoja de tarifas": fondo gris verdoso, color principal
  petróleo, bordes finos sin sombras y la tipografía Atkinson Hyperlegible,
  que distingue 0/O y 1/I/l (importante en DNI y CIF) y alinea los importes.
- La aprobé con un cambio: la fuente instalada en el proyecto y no cargada
  desde Google Fonts, para que la app no dependa de un servicio externo.
  Solo modo claro, para tener una única paleta que revisar.
- Resultado: layout responsive, sin errores en consola en móvil y escritorio.
  La IA quitó la paleta por defecto de Tailwind para que solo existan los
  colores del tema, y no instaló SweetAlert2: sin editar ni borrar no hay
  nada que confirmar.
- Medí el contraste de la paleta: todos los textos cumplen WCAG AA. El color
  de los bordes no llega a 3:1, así que no sirve para el contorno de los
  campos de formulario; lo tendré en cuenta en F5.

## 25/11 · Bloque F2: contrato del frontend y conversión de divisas

- Interfaces, servicios y constantes gemelas del backend, comparadas con un
  script. La conversión de divisa convierte cada línea y suma las líneas
  ya convertidas, para que la factura cuadre en cualquier divisa.
- Ningún servicio del frontend calcula precios: piden el cálculo a la API.
- 10 pruebas en verde, cada una rota a propósito.
  -> `prompts/14-f2.md`

## 25/11 · Bloque F3: servicio y selector de divisa

- Al probar en móvil, la IA vio que su primera versión partía el logo y
  agrandaba la cabecera a 320 px, y lo corrigió antes de entregar.
- El enlace de la atribución se abre en una pestaña nueva, para no sacar al
  usuario de la app.
- Los tipos de cambio se piden una sola vez y se esperan como mucho 5 s. Si
  la API falla o tarda, la app sigue en euros y avisa.
  -> `prompts/15-f3.md`
- La IA señaló que no había leído las condiciones de la API de divisas. Las
  revisé: el servicio sin clave exige citarla. Añadí la atribución en el pie
  de la página: sin ella, la app incumplía las condiciones de uso.
- Añadí un estado "Cargando divisas…" al selector, que la spec pide en todas
  las pantallas.

## 25/11 · Bloque F4: buscador y dashboard

- Primera pantalla con datos reales: pedí probarla en el navegador contra el
  backend con los datos de ejemplo, en móvil y en escritorio.
  -> `prompts/16-f4.md`
- La búsqueda espera 300 ms tras la última tecla y cancela la petición
  anterior. Comprobado contra la API real: busca por nombre e identificador,
  encuentra "IBÉRICA" y trata `%` como texto.
- Estados vistos en pantalla: cargando, "No hay resultados", error de la API
  y "No se puede conectar con el servidor" con el backend parado.
- Decidí no añadir un botón de reintentar: la spec no lo pide y basta con
  volver a escribir.
- Una de las pruebas en el navegador dio un resultado raro que no se pudo
  repetir. Queda apuntado como "no reproducido".

## 25/11 · Bloque F6: detalle del cliente e historial

- Hice F6 antes que F5: el detalle es una vista obligatoria de los requisitos y
  el alta no. Si faltara tiempo, prefiero recortar el alta.
  -> `prompts/17-f6.md`
- Tarjetas con los datos del cliente e historial de simulaciones. Al cambiar
  la divisa, los importes cambian sin volver a pedir datos al backend:
  comprobado en el navegador.
- La IA adelantó un problema para F7: al convertir de divisa los tramos uno
  a uno, su suma podía no coincidir con la base convertida. Lo decidí antes
  de programar el simulador (ver F7).

## 25/11 · Bloque F7: simulador

- La IA comprobó 800 combinaciones de usuarios y países en dólares y encontró
  10 en las que el 21 % de la base convertida no daba exactamente el impuesto
  convertido. Acepté su propuesta: cuando la divisa no es el euro, se indica
  "calculado en euros". Es coherente con dejar el precio por usuario en euros:
  la tarifa y el impuesto son los de euros, y lo convertido es una referencia.
- La IA encontró y corrigió un fallo suyo: a 320 px el campo de usuarios se
  salía de la tarjeta.
- Antes de programar decidí la regla de conversión para que todo cuadre en
  pantalla: se convierte cada tramo, la base es la suma de los tramos ya
  convertidos y el total es la base más el impuesto convertido.
  -> `prompts/18-f7.md`
- Una sola petición por arrastre del slider, el precio anterior atenuado con
  "calculando" y la simulación guardada aparece la primera del historial.
  En dólares, las sumas cuadran: comprobado a mano en el navegador.
- Corregí tres cosas al revisar:
  - Se veía "40 × 8,77 US$ = 350,70 US$", y la cuenta da 350,80. Dejé el
    precio por usuario en euros (es la tarifa) y solo se convierten los
    importes: ninguna cuenta visible miente.
  - El botón de guardar se desactiva mientras calcula o si el cálculo falla.
  - La parte sin recorrer del slider apenas se veía; se ajustó el color.
- En otra divisa, el simulador y el historial pueden diferir en un céntimo.
  Lo acepté y lo anoté en la spec: la conversión es informativa y en euros
  coinciden siempre.

## 25/11 · Bloque F5: alta de cliente

- Formulario con los mismos límites y textos de error que la API. País y
  plan son desplegables y no se puede enviar con un campo mal.
  -> `prompts/19-f5.md`
- El identificador solo se comprueba en formato: la letra de control la
  valida el servidor, para no duplicar el algoritmo. Si es falso, el error
  sale junto al campo, igual que el de cliente repetido.
- Al crear, avisa y lleva al detalle del cliente nuevo.
- Probé yo mismo la app completa en el navegador: <lo que encontraste>.

## 25/11 · Bloque F8: animaciones y repaso visual

- Fundidos de 100 a 150 ms al aparecer y desaparecer, y transición de color
  al pasar el ratón. No se anima donde un bloque sustituye a otro, para que
  la página no dé saltos.
  -> `prompts/20-f8.md`
- Pedí respetar `prefers-reduced-motion`: si el usuario tiene desactivadas
  las animaciones en su sistema, no hay ninguna.

## 25/11 · Prueba manual en el navegador

- Probé la app con el Claude revisor en mi Chrome: un uso normal y 16
  intentos de romperla contra la API. Ningún error 500, y un nombre de
  empresa con código HTML se muestra como texto, sin ejecutarse.
- Primera prueba con la API de divisas real: funciona, y las cuentas cuadran
  en dólares.
- Encontró dos fallos que contradecían decisiones ya tomadas: faltaba la
  etiqueta "No modifica el precio" (se perdió al reescribir la spec) y el
  impuesto en otra divisa no decía "calculado en euros" (la corrección no
  llegó a aplicarse).
- Revisé el prompt de corrección antes de enviarlo y vi que el revisor había
  dejado fijo el 21 % de España como ejemplo: cada cliente lleva el de su país.
  -> `prompts/21-prueba-manual.md`