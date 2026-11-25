import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SesionService } from '../services/sesion.service';

// Sin sesion -> login, recordando a donde iba para volver despues.
// Los guards deciden la NAVEGACION; la seguridad de verdad la vuelve a comprobar la API en cada peticion.
export const authGuard: CanActivateFn = (_ruta, estado) => {
  if (inject(SesionService).iniciada()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};
