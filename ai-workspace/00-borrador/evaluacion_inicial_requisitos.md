Objetivo: construir SaaS-O-Matic, una herramienta interna para que el equipo
comercial pueda simular, optimizar y presupuestar suscripciones SaaS
multi-divisa para clientes corporativos.


==================== BACKEND ====================

- Stack: Node.js (TypeScript)
- Base de datos: SQLite

- Endpoints que piden los requisitos:

    - POST /customers: registra un cliente corporativo
        - Datos a guardar: nombre de empresa, identificador fiscal
          (DNI/NIF/CIF), email de contacto, país y plan elegido.
        - Verificación: validación estricta del identificador fiscal. Si el
          país es España hay que comprobar que es verdadero con el algoritmo
          oficial de control.
            - Solución para la verificación:
              NIF es el nombre general del identificador fiscal. Hay tres casos:
                1. DNI: NIF de una persona española.
                2. NIE: NIF de una persona extranjera residente.
                3. CIF: NIF de una empresa.

              Pasos:
                1. Normalizar (mayúsculas, sin espacios, puntos ni guiones).
                2. Identificar cuál de los tres es por su forma.
                3. Recalcular el carácter de control y compararlo.

              Paso 2a: DNI (8 dígitos + letra)
                - Divide el número entre 23 y quédate con el resto.
                - Ese resto es la posición en TRWAGMYFPDXBNJZSQVHLCKE
                  (empezando en 0).
                - La letra de esa posición tiene que ser la del DNI.
                Ejemplo: 12345678 % 23 = 14 -> posición 14 = Z
                         -> 12345678Z es válido.

              Paso 2b: NIE (X, Y o Z + 7 dígitos + letra)
                - Cambia la primera letra por un dígito: X->0, Y->1, Z->2.
                - Aplica el algoritmo del DNI al número de 8 cifras que queda.
                Ejemplo: X1234567 -> 01234567 % 23 = 19 -> L
                         -> X1234567L es válido.

              Paso 2c: CIF (letra + 7 dígitos + control)
                Con los 7 dígitos del centro, numerados del 1 al 7:
                - A = suma de los dígitos en posiciones pares (2, 4, 6).
                - B = cada dígito en posición impar (1, 3, 5, 7) se multiplica
                  por 2; si da dos cifras, se suman entre sí (16 -> 1+6 = 7).
                  Se suma todo.
                - C = A + B.
                - Control = (10 - C % 10) % 10.
                - El control va como dígito o como letra (JABCDEFGHI,
                  posición = control), según la primera letra:
                    A B E H        -> tiene que ser dígito.
                    P Q R S N W    -> tiene que ser letra.
                    C D F G J U V  -> vale cualquiera de los dos.
                Ejemplo: A5881850? -> A = 8+1+5 = 14, B = 1+7+7+0 = 15,
                         C = 29 -> control = 1 -> A58818501 es válido.

        - Ojo: comprobar solo el formato NO vale. 12345678A tiene buen
          formato y es falso.
        - Otros países: solo se comprueba el formato.
        - No puede haber dos clientes con el mismo identificador.

    - POST /simulations: registra una simulación de consumo de un cliente
        - Datos que llegan: id del cliente, usuarios activos, almacenamiento
          contratado y llamadas a la API estimadas.
        - Hay que calcular el coste y GUARDARLO en la base de datos.
        - El cliente tiene que existir. Si no, error.
        - El país para el impuesto se saca del cliente, no de la petición.

- Lógica de negocio: facturación gradual por tramos (acumulativa)

    Tramo 1: usuarios del 1 al 10      -> 10 €/usuario
    Tramo 2: usuarios del 11 al 50     ->  8 €/usuario
    Tramo 3: usuarios del 51 en adelante -> 5 €/usuario

    - Acumulativa = cada usuario paga el precio de SU tramo. No se aplica el
      precio del último tramo a todos.
    - Ejemplo de los requisitos: 15 usuarios = 10x10 + 5x8 = 100 + 40 = 140 €.
    - Pasos del cálculo:
        1. Recorrer los tramos en orden.
        2. En cada uno, contar cuántos usuarios caen dentro.
        3. Multiplicar por el precio del tramo y sumar.
        4. Al total se le suma el impuesto (IVA) del país del cliente.
    - Casos que tengo que probar sí o sí (los bordes):
        1 -> 10 €    10 -> 100 €    11 -> 108 €    15 -> 140 €
        50 -> 420 €  51 -> 425 €   100 -> 670 €
        0 usuarios -> se rechaza.
    - El dinero en céntimos enteros, nunca con decimales (0.1 + 0.2 no da 0.3).
    - Se guarda en euros. La divisa es solo para enseñar en pantalla.

- Lo que los requisitos NO piden pero hace falta para que funcione:
    - GET para buscar clientes (el buscador lo necesita).
    - GET del detalle de un cliente.
    - GET del historial de simulaciones de un cliente.
    - Un cálculo sin guardar, para que el slider enseñe el precio al moverlo.

- Base de datos (2 tablas):
    - clientes: id, nombre de empresa, identificador fiscal (único), email,
      país, plan, fecha de creación.
    - simulaciones: id, cliente, usuarios, almacenamiento, llamadas a la API,
      coste base, % de impuesto aplicado, impuesto, total, fecha.
    - Guardo el % de impuesto aplicado para que el historial no cambie si
      mañana cambia el IVA.

- Errores: siempre con la misma forma y con el código correcto
    400 dato mal formado · 404 no existe · 409 duplicado · 500 genérico.


==================== FRONTEND ====================

- Stack: Angular

- API externa de tipos de cambio (https://open.er-api.com/v6/latest/EUR)
    - El usuario cambia la divisa (EUR, USD, GBP...) y ve los costes
      convertidos al momento.
    - Pasos:
        1. Pedir los tipos de cambio una vez y guardarlos.
        2. Convertir solo al pintar: importe en euros x tipo de la divisa.
        3. Al cambiar de divisa, se actualizan todos los importes.
    - Hay que manejar: cargando, error y que la API tarde. Si falla, la
      pantalla sigue funcionando en euros y avisa.

- Vistas obligatorias:

    1. Buscador y dashboard
        - Buscar por nombre de empresa o por identificador fiscal.
        - Estados: cargando, sin resultados, error.

    2. Detalle del cliente (cards)
        - Tarjetas responsive con los datos del cliente.
        - Listado / historial de sus simulaciones guardadas.

    3. Formulario de simulación interactiva
        - Slider (o controles) para ajustar los usuarios.
        - Ver en tiempo real la factura mensual: tramos + impuesto,
          convertida a la divisa elegida.
        - Botón para guardar la simulación.

- Hace falta también un formulario de alta de cliente, para poder usar
  POST /customers desde la pantalla y ver el error del identificador.

- El frontend NO repite la fórmula de los tramos. Pregunta al backend.
  Una sola fórmula = no puede haber dos precios distintos.


==================== ENTREGABLES ====================

- Código en GitHub + carpeta /ai-workspace con:
    1. Specs y planificación ANTES de programar.
    2. Arquitectura y las directrices que le doy a la IA.
    3. Proceso real con la IA: prompts clave y correcciones.
- README para levantar backend y frontend en local en pocos pasos.


==================== DUDAS QUE DEJAN LOS REQUISITOS ====================

1. Almacenamiento y llamadas a la API se guardan, pero no tienen precio.
   -> Guardar pero no cobrar, para no inventar tarifas
2. "Plan elegido": no dice qué planes hay ni si cambian el precio.
   -> Tres planes como etiqueta. No cambian el precio.
3. No nombra el NIE.
   -> Se valida también: es el mismo algoritmo que el DNI.
4. No da la tabla de impuestos por país.
   -> Tabla fija con unos pocos países y su IVA general.
5. No dice si hay login.
   -> Sin login: es una herramienta interna y no lo pide.
6. ¿Quién calcula el precio del slider?
   -> El backend, para tener la fórmula en un solo sitio.


==================== ORDEN DE TRABAJO ====================

1. Specs y arquitectura (antes de programar).
2. Lógica pura con pruebas: validación fiscal y tramos.
3. Base de datos y endpoints.
4. Diseño de las pantallas.
5. Frontend.
6. Auditoría, README y prueba desde cero.