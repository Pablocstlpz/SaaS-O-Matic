# Prueba manual en el navegador

## Contexto

Probé la app con el Claude revisor en mi Chrome: un uso normal (buscar,
detalle, cambio de divisa, simulador y alta) y 16 intentos de romperla
contra la API. Era la primera prueba con la API de divisas real.

Salieron dos fallos que contradecían decisiones ya tomadas:

- Faltaba la etiqueta "No modifica el precio": se perdió al reescribir la spec.
- El impuesto en otra divisa no decía "calculado en euros": la corrección
  del pendiente 161 no llegó a aplicarse.

Al revisar el prompt antes de enviarlo, vi que el revisor había dejado fijo
el 21 % de España como si fuera la regla. Lo corregí: cada cliente lleva el
porcentaje de su país.

## Encargo

```text
Al probar la app en el navegador han salido dos fallos:

1. Falta la etiqueta "No modifica el precio" en los campos de almacenamiento
   y llamadas a la API del simulador. Añádela y recógela en la spec, §5.
2. Pendiente 161 sin aplicar: cuando la divisa no es el euro, el impuesto
   debe decir "Impuesto (<porcentaje del país> %, calculado en euros)", por
   ejemplo "Impuesto (19 %, calculado en euros)" para Alemania, en el
   simulador y en el historial. En euros se queda como está. Recógelo en
   la spec, §5.

Una prueba para cada uno, rota una vez. Sin commit.
```

Resultado: los dos arreglados, con su prueba. El historial no tiene prueba
propia del impuesto (usa la misma expresión que el simulador); queda en
pendientes.
