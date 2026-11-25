# SaaS-O-Matic

Herramienta interna para simular y presupuestar suscripciones SaaS multidivisa.
`backend/`: Node + Express 5 + Sequelize + SQLite, en TypeScript. `frontend/`: Angular 21 standalone.

## Fuentes de verdad (no las copies aquí; léelas)

1. **Qué hace la app:** `ai-workspace/01-SPEC.md`. Si choca con algo, manda la spec.
2. **Cómo se organiza:** la skill `arquitectura-angular`, en `.claude/skills/arquitectura-angular/`:
   `SKILL.md`, `references/backend-node.md` y `references/frontend.md`. Ignora .NET y Python.
3. **Dónde nos apartamos de la skill:** `docs/decisiones.md`. Léelo antes de copiar nada de
   `plantilla/`, porque allí hay login, organizaciones, `/api`, tabla de Material e i18n, y aquí no van.

Cada decisión nueva que se aparte de la skill se apunta en `docs/decisiones.md` en el mismo cambio.

## Lo que se mantiene de la skill

- Capas y sentido de las dependencias (SKILL.md §1). El backend usa las mismas carpetas y nombres
  que la plantilla Node, con `.ts`.
- `ErrorHttp` + manejador global en `app.ts`. Los controladores lanzan el error y no lo capturan.
- Errores con la forma `{ message, tipo, errors }`, siempre con las tres claves. Valores de `tipo`: en `docs/decisiones.md`.
- Constantes gemelas, con los mismos valores y un comentario en los dos ficheros que lo diga:
  `backend/src/utils/regex.ts` ↔ `frontend/src/app/shared/regex.ts`. Contienen `LIMITES`, `PLANES`,
  `PAISES` (código, nombre, IVA) y `TRAMOS` (en céntimos).
- JSON en snake_case, idéntico campo a campo a la interfaz TS de `frontend/src/app/interfaces/`.
- Frontend: el estado va en signals en el componente padre; los hijos reciben con `input()` y avisan con `output()`.
  Las suscripciones llevan `takeUntilDestroyed`. Los avisos van por `NotificacionesService`.
- Nuestra API se llama siempre a través de servicios que extienden `BaseHttpService`.
- API en el puerto 3000; frontend en el 4200. CORS solo para el origen del frontend.

## Estilos (frontend)

- Angular Material solo para controles: slider, select, campos de formulario, snackbar y spinner.
  Su tema (`material-theme.scss`) se ajusta al diseño y es la única fuente de colores.
- Tarjetas, rejilla, espaciado y tipografía se hacen con Tailwind, usando los colores del tema.
  Sin `mat-card`.
- El `.css` de un componente solo lleva lo que Tailwind no resuelve.

## Dónde va cada regla de la spec

| Regla (spec) | Sitio |
|---|---|
| Normalizar nombre, identificador y email (§2, §3) | sanitizers de `validators/clientes.validator.ts`, **antes** de validar |
| Validación fiscal: DNI, NIE, CIF y fuera de España (§3) | funciones puras en `utils/identificadorFiscal.ts`. El validador las llama con el `pais` del cuerpo. Un identificador falso es 400 `VALIDACION` con `errors` en `identificador_fiscal` |
| País y plan dentro de la lista (§2, §3) | validador, con `PAISES` y `PLANES` de `utils/regex.ts` |
| Identificador fiscal único (§4) | el controlador comprueba antes de crear (409 `IDENTIFICADOR_REPETIDO`) **y** hay índice único en el modelo (409 `DUPLICADO`) |
| Tramos y coste base (§3) | `services/precios.service.ts`, recorriendo `TRAMOS`. Sin un `if` por tramo |
| Impuesto y total (§3) | el mismo servicio: IVA de `PAISES`, impuesto = `Math.round(base * iva / 100)`, todo en céntimos enteros |
| País del que sale el impuesto (§3) | `POST /simulations`: el del cliente, leído de la BD. `POST /simulations/calcular`: el `pais` del cuerpo, porque es solo una vista previa |
| La simulación guarda el % aplicado (§2) | el controlador de simulaciones guarda lo que devuelve el servicio de precios. No hay edición |
| El cliente de la simulación existe (§4) | controlador de simulaciones: si no existe, 400 `REFERENCIA_INVALIDA` con `errors` en `cliente_id` |
| Buscador: `q`, como mucho 50, orden por nombre (§4) | controlador de clientes, con `Op.like` del ORM. Nunca SQL montado a mano |
| Conversión de divisa y redondeo por línea (§5) | `frontend/src/app/services/divisas.service.ts` (tipos de cambio y divisa activa en signals) + una función pura en `shared/`. Solo se convierte al pintar |
| Buscador mientras se escribe, 300 ms (§5) | componente padre del buscador: `debounceTime` + `switchMap` |
| Slider: 250 ms, cancelar y «calculando» (§5) | componente padre del simulador: `debounceTime` + `switchMap`. Mientras calcula, el precio anterior se queda atenuado con «calculando»: no se vacía, pero tampoco se presenta como vigente |

Los casos de la spec §7 (tramos, impuesto, identificador fiscal y API) se convierten en pruebas tal cual.

## Tamaño

- Máximo **200 líneas por fichero** y **40 por función**. Si un fichero se pasa, se parte: en el backend
  se saca un servicio o una utilidad; en el frontend, un hijo, un pipe o una función de `shared/`.

## Prohibido

- `any`, también `as any`, `<any>` y `$any()`. Si un tipo no se conoce, se usa `unknown` y se estrecha.
- `console.log`. En el backend se usa `utils/logger.ts`; en el frontend, `NotificacionesService`.
- `try/catch` en los controladores: Express 5 lleva los errores al manejador global.
- `HttpClient` en los componentes. La única excepción a `BaseHttpService` es `divisas.service.ts`.
- Calcular tramos, coste base, impuesto o total fuera de `services/precios.service.ts`, y en especial
  en el frontend.
- Guardar `req.body`, por ejemplo `Modelo.create(req.body)`. Los controladores leen la entrada con
  `matchedData<T>(req)` (solo los campos validados) y la pasan campo a campo.
- Decimales en el dinero: se trabaja en céntimos enteros. El euro solo aparece al pintar.
- `innerHTML` con datos del usuario.

## Comandos que tienen que pasar antes de dar una tarea por terminada

```bash
cd backend  && npm run tipos && npm test                 # tsc --noEmit · vitest run
cd frontend && npx ng build                              # sin errores ni avisos
cd frontend && CI=1 npx ng test --watch=false
grep -rnE 'console\.log|: any\b|as any|<any>|\$any\(' backend/src frontend/src   # no debe salir nada
```

- Cada prueba nueva tiene que **fallar** si quitas lo que protege. Rómpelo a propósito, compruébalo y
  deshazlo.
- En el resumen di qué no has podido comprobar (por ejemplo, el navegador o la API de divisas real).

## Ante una duda que la spec no cubre

**Para y pregunta.** No inventes precios, países, reglas ni textos de error. Tampoco elijas entre dos
lecturas posibles de la spec. Lo mismo si la spec y la skill chocan en algo que `docs/decisiones.md`
todavía no resuelve.
