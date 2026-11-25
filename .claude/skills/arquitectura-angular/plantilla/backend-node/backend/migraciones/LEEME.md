# Migraciones

`migrar()` (`src/data/migraciones.js`) corre en cada arranque, en todos los entornos.
En una BD con datos: crea las tablas que faltan, aplica por orden de nombre los
`.sql` de esta carpeta que no estén en la tabla `migraciones` (cada uno se apunta al
terminar) y después crea los índices con nombre que falten. En una BD vacía crea
todo con el modelo de hoy y apunta las migraciones sin ejecutarlas.

Se escriben en el SQL del motor de producción (MySQL/MariaDB) y se ensayan contra
una copia de su BD: las pruebas no las ejecutan, porque su BD nace vacía.

**Por qué existe:** añadir un campo al modelo SIN migración funciona en una BD vacía
(las pruebas, tu primera instalación: `sync()` crea la tabla ya con la columna) y
falla en una que ya tiene la tabla, porque `sync()` no añade columnas a una tabla
existente. La API arranca y revienta en la primera consulta que use el campo.

## Reglas

- Nombre `NNN-descripcion.sql`: `001-…`, `002-…`. Con tres cifras el orden por
  nombre es el orden de aplicación (`10` iría antes que `2`).
- **Una migración aplicada no se edita nunca** ni se renombra: el nombre es lo que
  se apunta. Si estaba mal, se escribe otra.
- Varias sentencias por fichero, cada una terminada en `;` a final de línea. En
  MySQL el DDL no va en transacción: si la segunda falla, la primera ya quedó hecha.
  Mejor pocas sentencias por fichero.
- El cambio va **en los dos sitios**: en el modelo (para las BD nuevas) y en la
  migración (para las que ya existen). En una BD vacía las migraciones se apuntan
  sin ejecutarse, porque `sync()` ya crea las tablas con el modelo de hoy.
- Una tabla nueva no necesita migración: la crea `sync()`. Un índice declarado en
  el modelo **con `name`** tampoco: `sync()` añade los índices con nombre que falten
  también en tablas existentes, y una migración que lo cree fallaría por repetido.

## Ejemplo

```sql
-- 001-telefono-en-clientes.sql
ALTER TABLE clientes ADD COLUMN telefono VARCHAR(20) NULL;
```

y en `cliente.model.js`: `telefono: { type: DataTypes.STRING(20), allowNull: true }`.
