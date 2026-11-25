import { Component, WritableSignal, inject, input, numberAttribute, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, catchError, switchMap, tap } from 'rxjs';

import { Cliente } from '../../../interfaces/cliente';
import { Id } from '../../../interfaces/id';
import { Simulacion } from '../../../interfaces/simulacion';
import { ErrorApi } from '../../../services/base-http.service';
import { ClientesService } from '../../../services/clientes.service';
import { DivisasService } from '../../../services/divisas.service';
import { Cargando } from '../../compartidos/cargando/cargando';
import { HistorialSimulaciones } from '../../simulaciones/historial-simulaciones/historial-simulaciones';
import { Simulador } from '../../simulaciones/simulador/simulador';
import { ClienteDatos } from '../cliente-datos/cliente-datos';

// Detalle de un cliente con su simulador y su historial (spec §5). Es el padre: pide cliente e historial
// por separado, guarda el estado en signals y pasa a los hijos los datos y la divisa elegida.
@Component({
  selector: 'app-cliente-detalle',
  imports: [Cargando, ClienteDatos, HistorialSimulaciones, Simulador],
  templateUrl: './cliente-detalle.html',
  styleUrl: './cliente-detalle.css',
})
export class ClienteDetalle {
  private readonly clientesService = inject(ClientesService);
  protected readonly divisas = inject(DivisasService);

  // el :id de la ruta llega como texto; lo que no sea un id válido lo rechaza la API
  readonly id = input.required({ transform: numberAttribute });

  // null = todavía no ha llegado
  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly errorCliente = signal<string | null>(null);
  protected readonly simulaciones = signal<Simulacion[] | null>(null);
  protected readonly errorHistorial = signal<string | null>(null);

  constructor() {
    this.cargar((id) => this.clientesService.obtener(id), this.cliente, this.errorCliente);
    this.cargar((id) => this.clientesService.listarSimulaciones(id), this.simulaciones, this.errorHistorial);
  }

  // la recién guardada es la más nueva: va la primera, sin volver a pedir el historial
  protected anadir(simulacion: Simulacion): void {
    this.simulaciones.update((lista) => lista && [simulacion, ...lista]);
  }

  // pide algo del cliente de la ruta, y lo vuelve a pedir si cambia el id. Solo desde el constructor.
  private cargar<T>(
    pedir: (id: Id) => Observable<T>,
    datos: WritableSignal<T | null>,
    error: WritableSignal<string | null>,
  ): void {
    // el error se recoge dentro del switchMap: fuera cortaría el flujo y no se pediría otro id
    const intentar = (id: Id) =>
      pedir(id).pipe(
        catchError((e: ErrorApi) => {
          error.set(e.message);
          return EMPTY;
        }),
      );

    toObservable(this.id)
      .pipe(
        tap(() => {
          datos.set(null);
          error.set(null);
        }),
        switchMap(intentar),
        takeUntilDestroyed(),
      )
      .subscribe((valor) => datos.set(valor));
  }
}
