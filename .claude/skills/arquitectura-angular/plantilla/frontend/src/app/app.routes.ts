import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';

// Mapa de la aplicacion. TODAS las pantallas con loadComponent (carga diferida):
// el navegador solo descarga el codigo de una pantalla cuando se visita.
// Cada zona (publica, panel...) tiene su layout con <router-outlet> y sus pantallas como hijas.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  {
    path: 'login',
    loadComponent: () => import('./components/publico/login/login').then((m) => m.Login),
  },
  {
    path: 'panel',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./components/panel/panel-layout/panel-layout').then((m) => m.PanelLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'productos' },
      {
        path: 'productos',
        loadComponent: () => import('./components/panel/productos/productos').then((m) => m.Productos),
      },
      // crear y editar son la MISMA pantalla: la distingue que llegue :id o no
      {
        path: 'productos/nuevo',
        canActivate: [rolGuard('admin')],
        loadComponent: () =>
          import('./components/panel/productos/producto-formulario/producto-formulario').then(
            (m) => m.ProductoFormulario,
          ),
      },
      {
        path: 'productos/:id/editar',
        canActivate: [rolGuard('admin')],
        loadComponent: () =>
          import('./components/panel/productos/producto-formulario/producto-formulario').then(
            (m) => m.ProductoFormulario,
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./components/publico/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
  },
];
