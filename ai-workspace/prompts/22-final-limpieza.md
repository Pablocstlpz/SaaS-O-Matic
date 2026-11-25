# Bloque final (1) · Limpieza

## Encargo

```text
Responde en castellano.

Primera parte del bloque final de ai-workspace/02-PLAN.md:

1. Pasa Prettier al frontend y deja npm run formato:comprobar limpio.
2. npm audit en backend y frontend: para cada aviso alto o crítico, di si
   afecta a la app en uso (producción) o solo a desarrollo, y si tiene
   arreglo sin cambiar de versión mayor. Aplica solo los arreglos seguros.
   Apúntalo en ai-workspace/04-calidad/auditoria.md.
3. Resume ai-workspace/pendientes.md: arriba, una tabla con los 10 más
   importantes, clasificados como "limitación aceptada", "mejora" o "fuera
   de alcance". Debajo, el resto tal cual.

No cambies nada del comportamiento de la app. Al terminar: comandos de
CLAUDE.md, diff y lo que no has podido comprobar. Sin commit.
```

Partí el bloque final en cuatro pasos para revisar cada uno por separado.

Sin correcciones. Resultado: los 5 avisos altos del frontend eran de
herramientas de desarrollo (la app en uso tiene 0) y se arreglaron subiendo
versiones menores. En el backend, el único arreglo era bajar Sequelize a la
versión 3 y rompería la app, así que se queda documentado.
