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

23. **Parámetros de la URL como lista** (B7): `?q=a&q=b` llega como lista y `campoDelCuerpo` solo
    cubre el cuerpo.

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
39. **`cliente_id` enorme:** `1e20` da «El cliente no existe» y `1e30`, «debe ser un número entero».
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
