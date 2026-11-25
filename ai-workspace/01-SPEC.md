# SPEC — SaaS-O-Matic

## 1. Objetivo

Construir SaaS-O-Matic: una herramienta interna para que nuestro equipo comercial pueda simular, optimizar y presupuestar suscripciones SaaS multi-divisa para clientes corporativos.

Fuera de alcance (no está en los requisitos):

- Login y usuarios
- Editar o borrar clientes y simulaciones
- Cobrar el almacenamiento y las llamadas a la API (no tienen tarifa)

## 2. Datos

- Clientes:

* id (número) - Lo genera el sistema. Es la clave, NO el identificador fiscal
* Nombre de empresa (texto, obligatorio, de 2 a 120 caracteres) - Se limpian espacios al principio, al final y los dobles
* Identificador fiscal (texto, obligatorio, ÚNICO) - Se guarda normalizado: mayúsculas, sin espacios, puntos ni guiones
* Email de contacto (texto, obligatorio, máximo 254) - Formato de email válido, sin espacios y todo en minúscula
* País (código de 2 letras, obligatorio) - Solo los de la lista del apartado 3. En pantalla es un select
* Plan elegido (obligatorio) - Uno de: free, pro, max. Es una etiqueta, no cambia el precio
* Fecha de creación - La pone el sistema

- Simulación:

* id (número) - Lo genera el sistema
* ID de cliente (número, obligatorio) - Tiene que existir
* Usuarios activos (entero, de 1 a 100.000)
* Almacenamiento contratado en GB (entero, de 0 a 1.000.000)
* Llamadas a la API estimadas (entero, de 0 a 1.000.000.000)
* Coste base (céntimos)
* % de impuesto aplicado
* Impuesto (céntimos)
* Total (céntimos)
* Fecha de creación - La pone el sistema

- Notas de datos:

* El dinero se guarda en céntimos enteros de euro (14000 = 140,00 €). Nunca decimales
* Se guarda el % de impuesto aplicado para que el historial no cambie si mañana cambia el IVA
* Una simulación no se edita: es una foto del presupuesto de ese día

## 3. Reglas de negocio

- Validación del identificador fiscal

* Siempre se normaliza primero
* Si el país es España: se recalcula el carácter de control y se compara. Mirar solo el formato NO vale (12345678A tiene buen formato y es falso)
* Si el país NO es España: solo formato, de 4 a 20 letras y números
* NIF es el nombre general. Los tipos reales son tres:

* DNI (8 números + letra): número % 23 -> posición en TRWAGMYFPDXBNJZSQVHLCKE
* NIE (X, Y o Z + 7 números + letra): se cambia X->0, Y->1, Z->2 y se aplica lo del DNI
* CIF (letra + 7 números + control):
  - A = suma de los dígitos en posiciones pares (2, 4, 6)
  - B = cada dígito en posición impar (1, 3, 5, 7) x 2; si da dos cifras se suman entre sí. Se suma todo
  - Control = (10 - (A + B) % 10) % 10
  - El control va como número o como letra (JABCDEFGHI):
    - A B E H -> número
    - P Q R S N W -> letra
    - C D F G J U V -> vale cualquiera de los dos

- Coste mensual base: tarificación acumulativa por tramos

* Tramo 1 (usuarios del 1 al 10): 10 € / usuario
* Tramo 2 (usuarios del 11 al 50): 8 € / usuario
* Tramo 3 (del 51 en adelante): 5 € / usuario
* Acumulativa = cada usuario paga el precio de SU tramo
* Ejemplo: 15 usuarios = 10x10 + 5x8 = 140 €
* Los tramos van en una constante, no en ifs sueltos

- Impuesto

* Sale del país del CLIENTE, nunca de lo que mande la petición
* impuesto = coste base x % / 100, redondeado al céntimo. Total = base + impuesto
* Tabla (lista cerrada):

| País        | Código | IVA  |
| ----------- | ------ | ---- |
| España      | ES     | 21 % |
| Francia     | FR     | 20 % |
| Reino Unido | GB     | 20 % |
| Italia      | IT     | 22 % |
| Alemania    | DE     | 19 % |

- Un país fuera de la tabla se rechaza

* El cálculo vive solo en el backend. El frontend no repite la fórmula

## 4. Acciones (API)

- Común a todas:

* JSON en snake_case
* Error siempre con la misma forma: { message, tipo, errors: [{ campo, mensaje }] }
* 400 dato mal · 404 no existe · 409 duplicado · 500 genérico sin detalles

- POST /customers: registra un cliente

* Entra: nombre_empresa, identificador_fiscal, email_contacto, pais, plan
* Sale: 201 con el cliente creado (identificador ya normalizado)
* Falla: 400 si un campo está mal (dice cuál) · 409 si el identificador ya existe

- GET /customers?q=texto: buscador

* Busca dentro del nombre o del identificador, sin distinguir mayúsculas
* Sale: 200 con la lista (máximo 50, ordenada por nombre). Sin resultados = lista vacía, no error

- GET /customers/:id: datos de un cliente

* Sale: 200 con el cliente · 404 si no existe

- GET /customers/:id/simulations: historial

* Sale: 200 con sus simulaciones, la más nueva primero · 404 si el cliente no existe

- POST /simulations/calcular: calcula SIN guardar (para el slider)

* Entra: usuarios, pais
* Sale: 200 con desglose por tramos, coste base, % impuesto, impuesto y total

- POST /simulations: guarda una simulación

* Entra: cliente_id, usuarios, almacenamiento_gb, llamadas_api
* Sale: 201 con la simulación y su resultado
* Falla: 400 si un campo está mal o el cliente no existe

- Seguridad:

* Se valida SIEMPRE en el servidor, aunque el formulario ya valide
* Solo se guardan los campos esperados, nunca el cuerpo entero de la petición
* Consultas a través del ORM (parametrizadas), nunca SQL montado con texto del usuario
* Límites de longitud en todos los campos y cuerpo máximo de 100 KB
* CORS solo para el origen del frontend
* Los errores 500 no enseñan detalles internos
* En Angular no se usa innerHTML con datos del usuario

## 5. Pantallas

- Común a todas: estado cargando (spinner), vacío y error con mensaje claro. Responsive

- Selector de divisa (visible siempre): EUR, USD, GBP

* Los tipos se piden a https://open.er-api.com/v6/latest/EUR una vez y se guardan
* Se convierte solo al pintar. La base de datos siempre está en euros
* Redondeo: se convierte cada línea por separado a 2 decimales y el total es la suma de las líneas ya convertidas, para que cuadre
* Si la API falla o tarda: la app sigue en euros y avisa

- Buscador y Dashboard

* Busca por nombre o identificador mientras se escribe (espera 300 ms)
* Resultados en tarjetas. Sin resultados: "No hay resultados"
* Botón para dar de alta un cliente

- Alta de cliente

* Validación en vivo de cada campo, con los mismos límites que el backend
* País en un select; plan en un select
* Los errores del servidor se pintan junto a su campo (identificador falso, duplicado)

- Detalle del cliente (cards)

* Tarjetas responsive con sus datos
* Historial de simulaciones guardadas, con importes en la divisa elegida

- Simulación interactiva

* Al mover el slider: espera 250 ms y cancela la petición anterior. Mientras
  calcula, el precio anterior se ve atenuado con "calculando". Nunca se
  presenta un precio viejo como si fuera el vigente
* Se ve: desglose por tramos, coste base, impuesto y total
* Al mover el slider: espera 250 ms, cancela la petición anterior y muestra "calculando". Nunca se ve un precio viejo
* Botón guardar: guarda y la simulación aparece en el historial

- Animaciones: transiciones suaves al aparecer, desaparecer, seleccionar y hover. Cortas, que no retrasen el uso

## 6. Decisiones ante dudas

- ¿Qué países e impuestos? -> No aparece. España, Francia, Reino Unido, Italia y Alemania con su IVA general
- ¿Almacenamiento y llamadas a la API cuestan? -> No tienen tarifa. Se guardan y no se cobran; no me invento precios
- ¿El plan cambia el precio? -> No. La única regla de precio depende de los usuarios
- ¿Se valida el NIE? -> Sí, es el mismo algoritmo que el DNI
- ¿CIF que empieza por C D F G J U V? -> Las fuentes no coinciden; acepto número o letra para no rechazar clientes reales
- ¿0 usuarios? -> Se rechaza. Mínimo 1
- ¿Clientes duplicados? -> No. Identificador fiscal único
- ¿Máximo de clientes? -> Sin límite. El buscador devuelve 50 como mucho
- ¿Quién calcula el slider? -> El backend, para tener una sola fórmula
- ¿Login? -> No. Es interna y no se pide

## 7. Casos de prueba

- Tramos (coste base):

| Usuarios | Resultado |
| -------- | --------- |
| 0        | rechazado |
| 1        | 10 €      |
| 10       | 100 €     |
| 11       | 108 €     |
| 15       | 140 €     |
| 50       | 420 €     |
| 51       | 425 €     |
| 100      | 670 €     |

- Impuesto:

| País | Usuarios | Base     | Impuesto | Total    |
| ---- | -------- | -------- | -------- | -------- |
| ES   | 15       | 140,00 € | 29,40 €  | 169,40 € |
| DE   | 51       | 425,00 € | 80,75 €  | 505,75 € |
| FR   | 10       | 100,00 € | 20,00 €  | 120,00 € |

- Identificador fiscal (país ES):

| Entrada      | Resultado                    |
| ------------ | ---------------------------- |
| 12345678Z    | válido (DNI)                 |
| 12345678A    | inválido                     |
| X1234567L    | válido (NIE)                 |
| A58818501    | válido (CIF, control número) |
| A58818502    | inválido                     |
| Q2826000H    | válido (CIF, control letra)  |
| Q28260008    | inválido (Q exige letra)     |
| a-58.818.501 | válido (se normaliza antes)  |

- API: cliente duplicado -> 409 · simulación con cliente que no existe -> 400 · país fuera de lista -> 400
- Pantalla: API de divisas caída -> sigue en euros con aviso

## 8. Stack

Backend: Node + Express (TypeScript)
Frontend: Angular (TypeScript)
BD: SQLite
