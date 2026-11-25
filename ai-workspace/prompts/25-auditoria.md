# Auditoría técnica independiente

## Encargo

Con Claude Opus, en una conversación nueva que no había visto cómo se
construyó el código.

```text
Responde en castellano.

Eres un auditor técnico independiente. No has participado en este proyecto.
Revisa el código de backend/ y frontend/ contra ai-workspace/01-SPEC.md,
CLAUDE.md y docs/decisiones.md. Es una revisión: NO cambies código.

Revisa, en este orden:

1. Reglas de negocio. Comprueba con un script, no a ojo:
   - Tramos acumulativos en los bordes (1, 10, 11, 50, 51, 100 000).
   - IVA de cada país y redondeo, siempre en céntimos enteros.
   - DNI, NIE y CIF: busca identificadores reales válidos que se rechacen e
     inválidos que se acepten, en todos los tipos de CIF.
   - Que el IVA al guardar sale del cliente y nunca de la petición.
2. Seguridad: inyección SQL, entrada sin validar o sin límite de tamaño,
   asignación masiva de campos, CORS, cabeceras, errores que filtren detalles
   internos y datos del usuario pintados sin escapar en el frontend.
3. Contrato: que cada respuesta y cada error del backend coincide campo a
   campo con las interfaces del frontend y con la spec §4.
4. Calidad de las pruebas: busca pruebas que pasarían con el código roto
   (que solo comprueban aciertos, que no comprueban nada o que comprueban la
   implementación y no el comportamiento). Elige 5 al azar y rompe a propósito
   lo que protegen para confirmar que fallan.
5. Arquitectura y reglas de CLAUDE.md: capas y sentido de las dependencias,
   ficheros de más de 200 líneas y funciones de más de 40 (mídelo con un
   script), any, lógica de precios fuera de su servicio, lógica duplicada
   entre ficheros y constantes gemelas distintas entre backend y frontend.
6. Frontend: suscripciones sin cerrar, peticiones sin cancelar, estados de
   carga, vacío y error en cada pantalla, y accesibilidad básica (etiquetas,
   foco y teclado).
7. Coherencia: cosas que la spec dice y el código no hace, o al revés.

Entrega ai-workspace/04-calidad/auditoria-codigo.md con:
- Un resumen de 5 líneas con tu valoración general.
- Una tabla de hallazgos: gravedad (crítica, alta, media, baja), fichero y
  línea, qué pasa, cómo lo comprobaste y cómo se arreglaría.
- Lo que está bien hecho, con ejemplos concretos.
- Lo que no has podido comprobar.

No inventes hallazgos: cada uno tiene que estar comprobado. Si no encuentras
fallos graves, dilo. Sin commit.
```

Resultado: ningún fallo crítico ni alto. Un fallo real de nivel medio (orden
del historial con fechas iguales), dos huecos de pruebas y siete detalles de
nivel bajo. Todo comprobado con scripts o rompiendo el código a propósito.
