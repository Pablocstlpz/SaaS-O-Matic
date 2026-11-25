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
