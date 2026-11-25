import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, debounceTime, skip, startWith, switchMap, tap } from 'rxjs';

import { Cliente } from '../../../interfaces/cliente';
import { ErrorApi } from '../../../services/base-http.service';
import { ClientesService } from '../../../services/clientes.service';
import { Cargando } from '../../compartidos/cargando/cargando';
import { ClienteTarjeta } from '../cliente-tarjeta/cliente-tarjeta';

const ESPERA_TECLEO_MS = 300;

// Inicio de la app: buscador de clientes (spec §5). Es el padre: pide, guarda el estado en signals
// y decide adónde lleva cada tarjeta.
@Component({
  selector: 'app-clientes-buscador',
  imports: [RouterLink, MatFormFieldModule, MatInputModule, Cargando, ClienteTarjeta],
  templateUrl: './clientes-buscador.html',
  styleUrl: './clientes-buscador.css',
})
export class ClientesBuscador {
  private readonly clientesService = inject(ClientesService);

  protected readonly q = signal('');
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    toObservable(this.q)
      .pipe(
        // la primera emisión es el texto vacío de entrada: esa búsqueda la lanza startWith, sin espera
        skip(1),
        debounceTime(ESPERA_TECLEO_MS),
        startWith(''),
        tap(() => this.empezar()),
        // una búsqueda nueva cancela la anterior
        switchMap((q) => this.buscar(q)),
        takeUntilDestroyed(),
      )
      .subscribe((clientes) => {
        this.clientes.set(clientes);
        this.cargando.set(false);
      });
  }

  private empezar(): void {
    this.cargando.set(true);
    this.error.set(null);
  }

  // el error se recoge aquí, dentro del switchMap: fuera cortaría el flujo y no se podría volver a buscar
  private buscar(q: string): Observable<Cliente[]> {
    return this.clientesService.listar(q).pipe(
      catchError((e: ErrorApi) => {
        this.error.set(e.message);
        this.cargando.set(false);
        return EMPTY;
      }),
    );
  }
}
