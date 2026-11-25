# Revisar código existente

Para cuando te piden revisar un controlador, un módulo, un cambio o un proyecto
entero contra este estándar, o adaptar código que no nació de la plantilla.

La idea central: **no todo lo que difiere del estándar se arregla igual**. Un fallo
que deja ver datos ajenos se corrige ya; un nombre distinto se corrige si tocas ese
fichero; un cambio en lo que la API devuelve se propone, porque rompe a quien la
consume.

---

## 1. Antes de opinar

1. ¿Qué backend es? `package.json` con `express` → Node; `*.csproj` → .NET;
   `pyproject.toml` con `fastapi` → Python.
2. Lee la composición (`app.js` / `Program.cs` / `main.py`), una pieza de cada capa del mismo
   recurso y **el código que lo consume** (el servicio Angular, otra API). Sin ver
   al consumidor no se puede saber qué cambio del contrato es seguro.
3. Anota las convenciones del proyecto (idioma, verbos, camelCase o snake_case,
   forma de las respuestas). Las coherentes se respetan (reglas 2 y 3 de SKILL.md):
   castilfootball sigue en camelCase aunque el estándar diga snake_case.
4. Si hay pruebas, ejecútalas antes de cambiar nada; si no hay, dilo.

## 2. Clasificar cada hallazgo

| Clase | Qué es | Qué se hace |
|---|---|---|
| **Bloqueante** | Seguridad o un fallo que ya ocurre: datos de otro propietario visibles o modificables, identidad tomada del cuerpo o de la URL, asignación masiva (`update(req.body)`, guardar el DTO), autorización solo en el frontend, secretos en el código o en el log, `ex.Message` o la traza en la respuesta, `Forbid("texto")` (500), `[Required]` sobre `int`/`decimal`/`bool` no anulable (no valida nada), escrituras sin validar, unicidad solo comprobada en código sin índice. | Se corrige en este cambio, con una prueba que falle sin la corrección. |
| **Estándar** | Funciona, pero no sigue la estructura: fichero que no se llama como la clase, DTOs dentro de `Models/`, `ModelState.IsValid` a mano, `try/catch` por acción, `GetCollection` repetido, `console.log`, verbos mezclados, servicio con interfaz de una sola implementación. | Se corrige en el código que la tarea ya toca. Lo que no se toca, se apunta. |
| **Cambio de contrato** | Cambia lo que ve el consumidor: forma de los errores, códigos (200→201, 400→409), envoltorios de respuesta (`{ message, porra }` → `Porra`), nombres de campos, rutas. | Se busca al consumidor (`grep` en el frontend: `res.porra`, `error.error.error`, `.mensaje`). Si está en el alcance, se cambian API y consumidor en el mismo cambio. Si no, se **propone** con una tabla antes/después y no se aplica. |
| **Transversal** | Afecta a lo que no estás revisando: introducir el manejador global de errores, cambiar `Program.cs`/`app.js`, opciones globales de validación o de JSON. | Se avisa de qué otros controladores cambian de comportamiento; se aplica solo si el consumidor lo aguanta o la tarea lo pide. |
| **Regla que falta** | El código no impide algo que el negocio prohíbe (pronosticar un partido ya empezado, reservar en el pasado) y no sabes si se comprueba en otro sitio. | Se señala arriba del todo, con la pregunta concreta; no se inventa la regla si faltan datos para aplicarla. |
| **Mejora** | Opinión de diseño sin defecto (partir un controlador de 350 líneas, pasar a capacidades). | Se apunta con el criterio de `calidad.md` §8 que la justificaría. |

Ante la duda entre dos clases, la más prudente: un cambio de forma de error es
siempre «cambio de contrato» aunque arregle algo. Convertir un **500** en su código
correcto (404, 400, 409) **no** lo es: nadie puede depender de un fallo.

Migrar poco a poco sin dos arquitecturas a la vez:

- Errores: mientras el frontend lea `error`, el manejador puede responder
  `{ message, error }` con el mismo texto (añadir un campo no rompe); cuando el
  frontend lea `message`, se quita `error`. Se anota en `docs/decisiones.md`.
- Acceso a datos (.NET): se crea `MongoContexto` y se pasa a él **un controlador
  entero** cada vez; el servicio viejo (`MongoDbService`) se borra cuando ya no lo
  usa nadie. Mezclar los dos dentro de un mismo controlador es lo que no vale.

Casos frecuentes y su respuesta estándar:

- Recurso de otro propietario → **404**, no 403 (no confirmes que existe).
- Ruta que lleva el id de quien llama (`/usuarios/{id}/porras`) → la identidad sale
  del token; si la ruta se mantiene por compatibilidad, se compara con el token y
  se responde 404 si no coincide. Proponer la ruta sin id como cambio de contrato.
- Varias formas de error (`{ error }`, `{ mensaje }`, texto, `ProblemDetails`) → la
  única `{ message, tipo?, errors? }`. Es cambio de contrato si el frontend leía
  otra; si el frontend solo lee `message`, unificar arregla avisos que hoy no se ven.
- Respuesta envuelta (`{ message, porra }`, `{ data }`) → el estándar devuelve la
  entidad sola y el texto de éxito lo pone la interfaz con una clave i18n. En un
  proyecto existente es cambio de contrato: proponer.

## 3. Informe

Escribe el informe con esta estructura (en castellano, en un fichero si te piden
entregarlo):

```markdown
# Revisión de <qué>

## Resumen
Tres o cuatro líneas: estado general, lo más grave, qué se ha cambiado y qué no.

## Hallazgos
### 1. <título> — Bloqueante | Estándar | Cambio de contrato | Transversal | Mejora
**Qué pasa:** el defecto, con la línea o el fragmento.
**Por qué importa:** lo que provoca (un 500, datos ajenos, un aviso que no se ve).
**Cambio:** lo que se ha hecho o se propone. Sección de la skill que lo respalda.

## Cambios aplicados
Ficheros tocados y qué se ha comprobado (compila, pruebas).

## Cambios de contrato propuestos (no aplicados)
| Caso | Hoy | Propuesto | Quién lo consume |

## Sin verificar
Lo que no se ha podido probar y por qué.
```

## 4. Si además hay que reescribir

- Entrega código que **compila** (y pasa sus pruebas si existen): `dotnet build`
  sin avisos, `npm test`, `uv run pytest` y `uv run ruff check`, `npx ng build`.
- Reescribe hacia la estructura del estándar (fichero = clase, `Dtos/`,
  `ErrorHttp` + manejador, helper de propietario), pero sin cambiar el contrato que
  no esté en el alcance: si la respuesta era `{ message, porra }` y no has podido
  ver el frontend, se mantiene y se propone el cambio.
- Lo que añadas para sostener la reescritura (manejador global, helpers) va en su
  carpeta del estándar y se menciona en el informe como transversal.
