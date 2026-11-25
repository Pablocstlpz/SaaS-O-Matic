import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { DatosCliente } from '../../../interfaces/cliente';
import { ErrorApi, ErrorCampo } from '../../../services/base-http.service';
import { ClientesService } from '../../../services/clientes.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { ClienteFormulario } from '../cliente-formulario/cliente-formulario';

// Alta de cliente (spec §5). Es el padre: envía, reparte los errores del servidor
// (los de un campo, al formulario; el resto, aquí) y al crear lleva al detalle.
@Component({
  selector: 'app-cliente-alta',
  imports: [ClienteFormulario],
  templateUrl: './cliente-alta.html',
  styleUrl: './cliente-alta.css',
})
export class ClienteAlta {
  private readonly clientesService = inject(ClientesService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly destruir = inject(DestroyRef);

  protected readonly guardando = signal(false);
  protected readonly erroresCampo = signal<readonly ErrorCampo[]>([]);
  protected readonly error = signal<string | null>(null);

  protected crear(datos: DatosCliente): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    this.clientesService
      .crear(datos)
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destruir),
      )
      .subscribe({
        next: ({ id }) => {
          this.notificaciones.aviso('Cliente dado de alta');
          void this.router.navigate(['/clientes', id]);
        },
        // un 409 DUPLICADO o un 500 no traen campo: van como mensaje general
        error: ({ errors, message }: ErrorApi) =>
          errors.length > 0 ? this.erroresCampo.set(errors) : this.error.set(message),
      });
  }
}
