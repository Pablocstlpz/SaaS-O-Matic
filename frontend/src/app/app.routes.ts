import { Routes } from '@angular/router';

// Mapa de la aplicacion. Todas las pantallas cuelgan del layout (la cabecera se ve siempre)
// y se cargan con loadComponent: el navegador solo descarga el codigo de lo que se visita.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout/layout').then((m) => m.Layout),
    children: [
      // inicio sin contenido hasta que exista el buscador (F4); sin esta ruta caeria en '**'
      { path: '', pathMatch: 'full', children: [] },
      {
        path: '**',
        loadComponent: () => import('./components/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
      },
    ],
  },
];
