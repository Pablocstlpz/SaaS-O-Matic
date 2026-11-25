# ai-workspace

Cómo se construyó SaaS-O-Matic con IA. Para empezar: `proceso.md`, y después `01-SPEC.md`.

- `proceso.md`: diario del trabajo, bloque a bloque: qué se pidió, qué se aceptó y qué se corrigió.
- `00-borrador/`: un resumen del proyecto y mi primera lectura de los requisitos.
- `01-SPEC.md`: qué hace la app. Si algo choca con ella, manda la spec.
- `02-PLAN.md`: la spec partida en bloques (B1–B8 backend, F1–F8 frontend), con pruebas y cuándo está terminado cada uno.
- `03-base-de-datos.md`: modelo, esquema, decisiones de la base de datos y organización de carpetas.
- `prompts/`: los prompts enviados a Claude Code, en orden, con sus correcciones.
- `pendientes.md`: casos vistos que el plan no cubre, anotados sin implementar; arriba, los 10 más importantes.
- `04-calidad/auditoria.md`: resultado de `npm audit` en backend y frontend.
- `04-calidad/fallos-detectados.md`: fallos de la IA encontrados al revisar y cómo se corrigieron.
- `metodologia.md`: por qué trabajé por bloques y no con agentes en paralelo.
- Directrices para la IA (fuera de esta carpeta): `../CLAUDE.md` (reglas del
  proyecto), `../.claude/skills/` (mi estándar de arquitectura y la skill de
  diseño) y `../docs/decisiones.md` (dónde y por qué me aparto del estándar).
