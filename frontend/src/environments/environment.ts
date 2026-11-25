// PRODUCCION. En `ng serve` (configuracion development) angular.json lo sustituye por
// environment.development.ts gracias a fileReplacements.
// Vacía: en Docker, nginx sirve la app y pasa la API desde el mismo origen.
// Aqui NUNCA van secretos: todo lo de este fichero acaba en el JavaScript que descarga el navegador.
export const environment = {
  production: true,
  apiUrl: '',
};
