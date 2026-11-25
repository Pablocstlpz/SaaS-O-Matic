import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { EMPTY, Observable, catchError, debounceTime, finalize, map, startWith, switchMap, takeUntil, tap } from 'rxjs';

import { Cliente } from '../../../interfaces/cliente';
import { Calculo, Simulacion } from '../../../interfaces/simulacion';
import { ErrorApi } from '../../../services/base-http.service';
import { SimulacionesService } from '../../../services/simulaciones.service';
import { Divisa } from '../../../shared/divisas';
import { LIMITES } from '../../../shared/regex';
import { Cargando } from '../../compartidos/cargando/cargando';
import { DesglosePrecio } from '../desglose-precio/desglose-precio';
import { crearFormulario, pintarErrores } from './formulario-simulacion';

const ESPERA_SLIDER_MS = 250;
const SLIDER_MAX = 200;

// Simulador de un cliente (spec §5). Es el padre: pide el cálculo mientras cambian los usuarios,
// guarda el estado en signals y avisa de cada simulación guardada. Los precios los calcula la API.
@Component({
  selector: 'app-simulador',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSliderModule, Cargando, DesglosePrecio],
  templateUrl: './simulador.html',
  styleUrl: './simulador.css',
  host: { class: 'block' },
})
export class Simulador {
  private readonly simulacionesService = inject(SimulacionesService);
  private readonly destruir = inject(DestroyRef);

  readonly cliente = input.required<Cliente>();
  readonly divisa = input.required<Divisa>();
  readonly guardada = output<Simulacion>();

  protected readonly formulario = crearFormulario();
  protected readonly sliderMin = LIMITES.USUARIOS_MIN;
  protected readonly sliderMax = SLIDER_MAX;
  // lo que sigue el slider; el campo numérico va con el formulario
  protected readonly usuarios = toSignal(this.formulario.controls.usuarios.valueChanges, {
    initialValue: this.formulario.controls.usuarios.value,
  });

  // el último precio recibido; null = no hay ninguno que enseñar
  protected readonly calculo = signal<Calculo | null>(null);
  protected readonly calculando = signal(true);
  protected readonly errorCalculo = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);
  // el precio se está calculando o el cálculo ha fallado: no se puede guardar (spec §5)
  protected readonly sinPrecio = computed(() => this.calculando() || this.calculo() === null);

  constructor() {
    // los avisos de cada campo se ven en vivo, sin esperar a que se toque
    this.formulario.markAllAsTouched();
    this.calcularAlCambiar();
  }

  protected mover(usuarios: number): void {
    const campo = this.formulario.controls.usuarios;
    // al soltar, el slider avisa otra vez del mismo valor
    if (usuarios !== campo.value) campo.setValue(usuarios);
  }

  protected guardar(): void {
    const { usuarios, almacenamiento_gb, llamadas_api } = this.formulario.getRawValue();
    // un segundo clic puede llegar antes de que el botón se pinte deshabilitado
    if (this.guardando() || this.sinPrecio() || this.formulario.invalid) return;
    if (usuarios === null || almacenamiento_gb === null || llamadas_api === null) return;

    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.simulacionesService
      .crear({ cliente_id: this.cliente().id, usuarios, almacenamiento_gb, llamadas_api })
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destruir),
      )
      .subscribe({
        next: (simulacion) => this.guardada.emit(simulacion),
        error: (e: ErrorApi) => this.errorGuardar.set(this.repartir(e)),
      });
  }

  // Solo desde el constructor. Almacenamiento y llamadas no cambian el precio: no se escuchan.
  private calcularAlCambiar(): void {
    const campo = this.formulario.controls.usuarios;
    campo.valueChanges
      .pipe(
        startWith(campo.value),
        // null = no hay nada que calcular
        map((usuarios) => (campo.valid ? usuarios : null)),
        tap((usuarios) => this.empezar(usuarios !== null)),
        debounceTime(ESPERA_SLIDER_MS),
        // takeUntil: un cambio cancela ya la petición en vuelo, sin esperar a los 250 ms
        switchMap((usuarios) => (usuarios === null ? EMPTY : this.pedir(usuarios).pipe(takeUntil(campo.valueChanges)))),
        takeUntilDestroyed(),
      )
      .subscribe((calculo) => {
        this.calculo.set(calculo);
        this.calculando.set(false);
      });
  }

  private empezar(hayQueCalcular: boolean): void {
    this.errorCalculo.set(null);
    this.calculando.set(hayQueCalcular);
    // sin un valor válido no hay precio vigente
    if (!hayQueCalcular) this.calculo.set(null);
  }

  // el error se recoge dentro del switchMap: fuera cortaría el flujo y no se volvería a calcular
  private pedir(usuarios: number): Observable<Calculo> {
    return this.simulacionesService.calcular({ usuarios, pais: this.cliente().pais }).pipe(
      catchError((e: ErrorApi) => {
        // el precio anterior era de otro valor: no se deja a la vista
        this.calculo.set(null);
        this.calculando.set(false);
        this.errorCalculo.set(this.repartir(e));
        return EMPTY;
      }),
    );
  }

  // pinta junto a su campo los errores que lo tengan; devuelve el mensaje si hay que pintarlo aparte
  private repartir(error: ErrorApi): string | null {
    return pintarErrores(this.formulario, error.errors) ? null : error.message;
  }
}
