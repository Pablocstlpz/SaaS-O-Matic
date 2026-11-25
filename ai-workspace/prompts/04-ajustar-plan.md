Respuestas a tus dudas:

1. Sin q: los 50 primeros por nombre.
2. % y \_ se buscan como texto literal.
3. La API de divisas espera 5 s; después, euros y aviso.
4. Tipos de cambio solo en memoria.
5. El formulario comprueba formato y longitud; la letra de control la
   valida el servidor.
6. Slider de 1 a 200, con un campo numérico al lado (1 a 100.000).
7. Simulador dentro del detalle del cliente.

Cambios:

- Añade estas decisiones a 01-SPEC.md §6 antes de tocar el plan.
- Importes con sufijo \_centimos (coste_base_centimos, impuesto_centimos,
  total_centimos, precio_unitario_centimos, subtotal_centimos).
- Junta B1+B2, B7+B9, F2+F3 y F8+F9.
- Añade al backend un script de datos de ejemplo (4-5 clientes con
  simulaciones) y añádelo a la spec.
- Añade un bloque final: auditoría, ai-workspace/04-calidad/, README
  probado desde un clon limpio.

Enséñame el diff. Sin commit.
