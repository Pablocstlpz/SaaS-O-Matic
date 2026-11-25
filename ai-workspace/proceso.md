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
