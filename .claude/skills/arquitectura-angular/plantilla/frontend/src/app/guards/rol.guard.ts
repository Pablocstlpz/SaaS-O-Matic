import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../interfaces/usuario';
import { SesionService } from '../services/sesion.service';

// Fabrica de guards: canActivate: [rolGuard('admin')] o [rolGuard('admin', 'usuario')].
// Va DESPUES de authGuard (en la ruta padre), asi aqui ya hay sesion.
export const rolGuard =
  (...roles: Rol[]): CanActivateFn =>
  () => {
    const usuario = inject(SesionService).usuario();
    if (usuario && roles.includes(usuario.rol)) return true;
    return inject(Router).createUrlTree(['/panel']);
  };
