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
