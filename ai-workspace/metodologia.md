# Metodología: por qué trabajé por bloques y no con agentes en paralelo

## Qué hice

Desarrollé la aplicación en **bloques pequeños y secuenciales** (8 de backend y
8 de frontend), cada uno ligado a un apartado de la spec, con un ciclo fijo:

1. Encargo acotado a Claude Code: un bloque, sus pruebas y nada más.
2. Informe de la IA: comandos, pruebas rotas a propósito y lo que no pudo comprobar.
3. Revisión del informe con un segundo Claude, en otra conversación, como revisor.
4. Mi decisión: aceptar, corregir o dejar en pendientes.
5. Commit hecho por mí y una entrada en `proceso.md`.

Cada modelo tuvo un papel:

| Papel                            | Modelo                                         |
| -------------------------------- | ---------------------------------------------- |
| Spec, reglas y plan              | Claude Opus                                    |
| Programar los bloques            | Claude Sonnet                                  |
| Revisar informes y probar la app | Un segundo Claude, sin haber escrito el código |
| Decidir                          | Yo                                             |

## Por qué aquí

- **Lo que importa es el criterio, no la velocidad.** Los requisitos piden dirigir
  a la IA y controlar lo que produce. Un bloque cada vez me deja decidir en cada
  paso, con cambios lo bastante pequeños para poder revisarlos.
- **Las restricciones reales:** menos de dos días de plazo y un límite de uso
  semanal casi agotado al empezar. Varios agentes en paralelo, cada uno releyendo
  todo el contexto, habrían gastado mucho más.
- **Los fallos no se propagan.** Si un bloque trae un error, se corrige antes de
  que los siguientes lo hereden.

## Lo que ganó: fallos parados entre bloques

| Bloque        | Fallo                                                                     | Qué habría pasado sin la pausa                                           |
| ------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| B4            | Una lista (`[]`) se saltaba la validación y daba un precio de 0 €         | B5 y B6 usaban la misma validación: todos los campos lo habrían heredado |
| B5            | Con un país incorrecto, también salía un error en el identificador fiscal | El formulario habría mandado corregir un dato que estaba bien            |
| B7            | La entrega "terminada" tenía cuatro errores 500                           | Habrían llegado al frontend sin que nadie los viera                      |
| F7            | En dólares se veía "40 × 8,77 = 350,70"                                   | Una cuenta visible que no cuadraba                                       |
| Prueba manual | Faltaban dos etiquetas acordadas en la spec                               | Se habrían entregado sin cumplir decisiones ya tomadas                   |

La lista completa está en `04-calidad/fallos-detectados.md`.

## Lo que perdió

**Velocidad.** Cada bloque esperaba a mi revisión antes de empezar el siguiente.
Con agentes en paralelo, backend y frontend podrían haber avanzado a la vez.
También exige disciplina: escribir cada encargo, leer cada informe y decidir
cada duda.

## Cuándo usaría agentes en paralelo y jerárquicos

Los uso en otros proyectos, y aquí no los descarto como método. Compensan cuando:

- Las tareas son **independientes entre sí** y no comparten reglas que puedan
  romperse a la vez.
- La spec está cerrada y hay **pruebas automáticas fuertes** que hacen de filtro.
- La **velocidad importa más que el detalle**: prototipos, exploraciones o
  cambios mecánicos repetidos en muchos ficheros.
- El volumen es tan grande que revisar bloque a bloque no es viable.

Su coste es que lo que llega a revisar es un resultado grande que no has visto
crecer, y es fácil aceptarlo sin entender cada decisión.

## Lo que me llevo

- **Revisar es parte del método, no un paso al final.** Los fallos más
  importantes salieron en revisiones entre bloques, no en la auditoría.
- **"Terminado" no es lo mismo que "revisado".** B7 lo demostró.
- **Ninguna IA se libra de equivocarse, tampoco la que revisa.** Al leer un
  prompt de corrección del revisor vi que había dejado fijo el IVA de España
  como si fuera la regla para todos los países.
- **El método no sustituye conocer el código.** Mantiene las decisiones bajo
  control y deja cambios que se pueden revisar; entender cada fichero en
  detalle es un trabajo que sigue siendo mío.
