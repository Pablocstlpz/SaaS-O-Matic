# Decisiones del proyecto

Una entrada por cada decisión que se aparta del estándar de arquitectura o adopta
una de sus extensiones. Tres o cuatro líneas: el siguiente que lea el código tiene
que saber que fue a propósito y por qué, para no deshacerlo ni copiarlo donde no toca.

Las más recientes arriba.

---

## AAAA-MM-DD · Propietario de los datos

**Qué:** cada recurso pertenece a la organización del usuario (`organizacion_id` del token).
**Por qué:** varias empresas usan la misma instalación y no pueden verse entre sí.
**Descartado:** propietario por usuario (los compañeros de una empresa comparten los datos).

<!--
Modelo para las siguientes:

## AAAA-MM-DD · <título corto>

**Qué:** <la decisión, en una frase>.
**Por qué:** <el problema concreto o la medición que la justifica>.
**Descartado:** <la alternativa y por qué no>.
-->
