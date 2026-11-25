# Extra · Guía de lectura y demo

## Encargo

```text
Tarea de documentación, sin tocar código. Antes, lee CLAUDE.md y README.md.

1. README.md
   a. Justo debajo del primer párrafo, añade una sección «## Demo» con:
      - https://saas-o-matic.pablosrv.com
      - Una línea: es una demo pública con los datos de ejemplo; lo que se guarde
        lo ve cualquiera que entre, así que no hay que meter datos reales.
   b. Sustituye la sección «## Proceso con IA», que repite lo que ya dice
      «Cómo se ha hecho», por «## Por dónde empezar». Pon esta lista, en este
      orden, con un enlace relativo a cada fichero y una línea que diga qué
      se encuentra en él:
      1. ai-workspace/01-SPEC.md, apartado «6. Decisiones ante dudas»: lo que
         los requisitos no fijaban y cómo lo decidí antes de programar.
      2. CLAUDE.md, apartado «Dónde va cada regla de la spec»: cómo le marqué
         a la IA dónde va cada regla.
      3. ai-workspace/04-calidad/fallos-detectados.md: los fallos de la IA que
         se pararon al revisar y cómo se corrigieron.
      4. ai-workspace/proceso.md: el diario completo, bloque a bloque.
      5. ai-workspace/metodologia.md: por qué trabajé así.
      No enlaces a anclas de apartados: nombra el apartado en el texto.
   c. En «Qué hace», en la línea del slider, añade el ejemplo de los tramos:
      15 usuarios = 10 × 10 € + 5 × 8 € = 140 € de base, más el IVA del país.

2. ai-workspace/01-SPEC.md, apartado 6, justo después de la línea de los
   países, añade:
   - ¿Qué divisas? -> EUR, USD y GBP, las que nombran los requisitos. Las tres
     tienen dos decimales, así que el redondeo por línea a céntimos vale para
     todas; una divisa sin decimales, como el yen, necesitaría otra regla.
     Añadir otra con dos decimales es sumarla a CODIGOS_DIVISA y a la lectura
     de tipos de divisas.service.ts
   Comprueba en el código que la línea es cierta (nombres y dónde se leen los
   tipos). Si algo no cuadra, para y dímelo.

3. ai-workspace/prompts/27-docker.md tiene dos huecos sin rellenar:
   «<el prompt de Docker que enviaste>» y «<el prompt de los tres ajustes>».
   Si tienes esos dos prompts en esta conversación, pégalos tal cual dentro de
   su bloque text. Si no los tienes, no los inventes ni los resumas: para y
   pídemelos.

4. No toques nada más. No cambies proceso.md ni crees el fichero del prompt:
   eso lo hago yo.

Al terminar: dame la lista de cambios y comprueba que los enlaces nuevos del
README apuntan a ficheros que existen. Mantén el formato del resto de los .md.

Sin commit.
```

Motivo: la documentación es larga y quería que lo importante se encontrara en
cinco minutos. Además, la spec no explicaba por qué solo hay tres divisas, y el
prompt de Docker tenía dos huecos sin rellenar.

## Corrección 1

Motivo: Claude Code paró en el punto 3 porque no tenía los prompts de Docker,
y el README repetía dos enlaces.

```text
Responde en castellano. Sigue con la tarea anterior: ahora ya puedes rellenar el 27.

1. ai-workspace/prompts/27-docker.md. Los prompts de Docker están en el
   historial de Claude Code de este equipo: ficheros .jsonl en
   ~/.claude/projects/ (en Windows, %USERPROFILE%\.claude\projects\). Busca la
   sesión cuyo primer mensaje del usuario empieza por «Extra fuera del plan:
   preparar la app para ejecutarse con Docker». Lee solo los mensajes que
   escribí yo: ni tus respuestas ni los resultados de herramientas.
   - El primero va en «## Encargo», en lugar de
     «<el prompt de Docker que enviaste>».
   - El que empieza por «Antes del commit, tres ajustes para mi servidor» va
     en la corrección de los tres ajustes, en lugar de
     «<el prompt de los tres ajustes>».
   - Si hay otro mensaje mío con instrucciones, por ejemplo uno que empieza
     por «Dos requisitos más para el despliegue» o por «Ajustes para mi
     servidor», añádelo como corrección en el orden en que lo envié, con una
     línea de motivo que diga solo lo que pide, y renumera las correcciones.
   - Copia los textos tal cual, sin retocarlos. Si esa sesión no está en este
     equipo, no rellenes nada: para y dímelo.

2. README.md: borra el último párrafo de «Cómo se ha hecho», el que empieza
   por «Para seguir el proceso de principio a fin». «Por dónde empezar» ya
   enlaza a esos dos ficheros.

3. Crea ai-workspace/prompts/28-guia-y-demo.md con el mismo formato que el
   resto:
   - Título: «# Extra · Guía de lectura y demo».
   - «## Encargo»: el prompt anterior de esta conversación, tal cual, en un
     bloque text. Debajo: «Motivo: la documentación es larga y quería que lo
     importante se encontrara en cinco minutos. Además, la spec no explicaba
     por qué solo hay tres divisas, y el prompt de Docker tenía dos huecos
     sin rellenar.»
   - «## Corrección 1»: «Motivo: Claude Code paró en el punto 3 porque no
     tenía los prompts de Docker, y el README repetía dos enlaces.» Debajo,
     este mensaje, tal cual, en un bloque text.

4. ai-workspace/proceso.md: añade al final esta entrada, tal cual:

   ## 25/11 · Guía de lectura y demo

   - Añadí al README la dirección de la demo y una guía de por dónde empezar,
     en lugar de una sección que repetía la anterior. La documentación es
     larga y quería que lo importante se encontrara en cinco minutos.
     -> `prompts/28-guia-y-demo.md`
   - Dejé por escrito en la spec por qué solo hay tres divisas: era la única
     duda sin justificar.
   - Completé el prompt de Docker, que tenía dos huecos sin rellenar.

5. No toques nada más.

Al terminar: dame la lista de cambios y dime de qué fichero del historial
sacaste los prompts de Docker. Mantén el formato del resto de los .md.

Sin commit.
```
