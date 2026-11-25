import { Routes } from '@angular/router';

// Mapa de la aplicacion. Todas las pantallas cuelgan del layout (la cabecera se ve siempre)
// y se cargan con loadComponent: el navegador solo descarga el codigo de lo que se visita.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./components/clientes/clientes-buscador/clientes-buscador').then((m) => m.ClientesBuscador),
      },
      // antes que clientes/:id, o «nuevo» se tomaría por un id
      {
        path: 'clientes/nuevo',
        loadComponent: () => import('./components/clientes/cliente-alta/cliente-alta').then((m) => m.ClienteAlta),
      },
      {
        path: 'clientes/:id',
        loadComponent: () =>
          import('./components/clientes/cliente-detalle/cliente-detalle').then((m) => m.ClienteDetalle),
      },
      {
        path: '**',
        loadComponent: () => import('./components/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
      },
    ],
  },
];
