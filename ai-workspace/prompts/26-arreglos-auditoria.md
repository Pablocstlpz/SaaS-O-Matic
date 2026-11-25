# Arreglos de la auditoría

## Encargo

En la misma conversación de la auditoría.

```text
Responde en castellano.

Arregla estos hallazgos de ai-workspace/04-calidad/auditoria-codigo.md, y
solo estos:

1. Hallazgo 1: ordena el historial por fecha_creacion DESC y después por id
   DESC. Añade una prueba con dos simulaciones de la misma fecha.
2. Hallazgo 2: prueba de que POST /simulations ignora id, fecha_creacion,
   porcentaje_impuesto e importes enviados en el cuerpo.
3. Hallazgo 3: añade Z1234567R (válido), K58818501 y T5881850A (inválidos)
   a la tabla de pruebas del identificador fiscal.
4. Hallazgo 5: el formulario cuenta el nombre por caracteres, igual que la
   API.
5. Hallazgo 6: el nombre rechaza caracteres de control y los que cambian la
   dirección del texto, con la misma regla que el carácter nulo.

Además:
- Hallazgo 9: anota en docs/decisiones.md que el límite de 40 líneas por
  función no cuenta los bloques describe de las pruebas.
- Hallazgos 4, 7, 8 y 10: pásalos a pendientes.md con la referencia a la
  auditoría.
- Al final de la auditoría, añade un apartado "Estado" con lo que se arregló
  y lo que queda pendiente.

Rompe una vez cada prueba nueva. Comandos de CLAUDE.md. Sin commit.
```

Arreglé lo que afecta a la spec o deja código sin proteger: el fallo del
orden, los huecos de pruebas y dos validaciones de una línea. Dejé
documentado lo que era una duda de negocio (NIF K/L/M, normalizar el
buscador), una refactorización (lógica duplicada) o una mejora
(accesibilidad del foco).

Sin correcciones. Resultado: 127 pruebas en el backend y 46 en el frontend,
y cada prueba nueva falla al romper lo que protege.
