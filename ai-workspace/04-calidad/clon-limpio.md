# Prueba en un clon limpio

Comprobación de que el repositorio arranca siguiendo solo el README, en un
equipo distinto del de desarrollo y sin nada instalado de antes. La hizo el
Claude revisor, en su propio entorno.

**Entorno:** Linux, Node 22.23.5 y npm 10.9.9. El desarrollo se hizo con
Node 24 y npm 11 y 12, así que también sirve para comprobar la versión mínima
que pide el README.

## 25/11, 18:12 · Repositorio completo, siguiendo el README

`git clone` del repositorio y los pasos del README, sin tocar nada más:

| Paso                                    | Resultado                                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `backend`: `npm ci`                     | Instala sin errores                                                                                         |
| `backend`: `npm run tipos`              | Sin errores                                                                                                 |
| `backend`: `npm test`                   | 119 de 119 pruebas                                                                                          |
| `frontend`: `npm ci`                    | Instala sin errores, también con el `package-lock.json` que se editó a mano en la auditoría de dependencias |
| `frontend`: `npx ng build`              | Sin errores ni avisos                                                                                       |
| `frontend`: `npx ng test --watch=false` | 46 de 46 pruebas                                                                                            |
| `frontend`: `npm audit --omit=dev`      | 0 vulnerabilidades en la app en uso                                                                         |
| Capturas del README                     | Las tres están en `docs/capturas/`                                                                          |

## 25/11, 13:16 · Backend terminado, con la API arrancada

Al cerrar el backend (B8), antes de empezar el frontend:

| Paso                                                   | Resultado                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `npm ci`, `npm run tipos` y `npm test`                 | Sin errores · 119 de 119 pruebas                               |
| `npm run datos-ejemplo`, primera vez                   | Crea 5 de 5 clientes                                           |
| `npm run datos-ejemplo`, segunda vez                   | Crea 0 de 5: no duplica                                        |
| `GET /salud`                                           | `{ "estado": "ok" }`                                           |
| `GET /customers`                                       | Los 5 clientes de ejemplo                                      |
| `GET /customers/1/simulations`                         | El historial del cliente                                       |
| `POST /simulations/calcular` con 60 usuarios en España | Base 470,00 €, IVA 98,70 €, total 568,70 € (comprobado a mano) |

Sirvió para comprobar algo que la IA no había podido probar: el script de
datos de ejemplo detecta si se lanza desde la consola comparando rutas, y solo
se había ejecutado en Windows. En Linux funciona igual.

## Lo que no se ha comprobado aquí

- **Windows y macOS** desde un clon limpio. El desarrollo se hizo en Windows y
  en Linux.
- **La app en el navegador desde este clon:** la prueba de uso en el navegador
  se hizo en el equipo de desarrollo (ver `proceso.md`, «Prueba manual en el
  navegador»).
- **La API de divisas real** desde este entorno, que no tiene acceso a esa web.
  Se comprobó en la prueba en el navegador.
