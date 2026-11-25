// PRODUCCION. En `ng serve` (configuracion development) angular.json lo sustituye por
// environment.development.ts gracias a fileReplacements.
// Aqui NUNCA van secretos: todo lo de este fichero acaba en el JavaScript que descarga el navegador.
export const environment = {
  production: true,
  apiUrl: 'https://api.ejemplo.com/api',
};
