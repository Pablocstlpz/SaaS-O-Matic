// PRODUCCION. En `ng serve` (configuracion development) angular.json lo sustituye por
// environment.development.ts gracias a fileReplacements.
// La app se ejecuta en local, asi que las dos apuntan a la misma API.
// Aqui NUNCA van secretos: todo lo de este fichero acaba en el JavaScript que descarga el navegador.
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000',
};
