# Proceso

## 24/11 · Análisis y borrador
- Leí los requisitos y los resumí con mis palabras.
  -> 00-borrador/evaluacion_inicial_requisitos.md
- Revisé el borrador con Gemini y Claude. Me señalaron el redondeo de
  divisas y que el slider podía enseñar precios viejos. Lo añadí.

## 25/11 · Spec
- Escribí la spec v1 a mano. -> 00-borrador/spec-v1.md
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
  * Quitar un comando que no existía (`formato:comprobar`).
  * Material solo para controles; tarjetas y maquetación con Tailwind, para
    que no parezca una app genérica.
  * Slider: dejar el precio anterior atenuado con "calculando" en vez de
    vaciarlo, para que no parpadee.
  * Versionar la skill (el `.gitignore` excluía `.claude` entero y quien
    clonara el repo no la tendría).
- La IA detectó que lo del slider contradecía la spec. Cambié primero la spec
  y después el código: la spec siempre manda.
- La IA corrigió por su cuenta una entrada de `decisiones.md` que seguía
  hablando de `mat-card`.
  -> `CLAUDE.md`, `docs/decisiones.md`