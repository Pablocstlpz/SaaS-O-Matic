import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, timeout } from 'rxjs';

import { CodigoDivisa, Divisa, EUR } from '../shared/divisas';

const URL_TIPOS = 'https://open.er-api.com/v6/latest/EUR';
const ESPERA_MAXIMA_MS = 5000;

// unidades de cada divisa por 1 euro
type Tipos = Record<CodigoDivisa, number>;

// lo que se lee de la respuesta; viene de fuera, así que todo puede faltar
type RespuestaTipos = { rates?: { USD?: unknown; GBP?: unknown } | null } | null;

const esCambio = (valor: unknown): valor is number => typeof valor === 'number' && Number.isFinite(valor) && valor > 0;

// sin los dos cambios no hay con qué convertir: cuenta como API caída
const leerTipos = (respuesta: RespuestaTipos): Tipos => {
  const USD = respuesta?.rates?.USD;
  const GBP = respuesta?.rates?.GBP;
  if (!esCambio(USD) || !esCambio(GBP)) throw new Error('Respuesta de tipos de cambio no válida');
  return { EUR: EUR.cambio, USD, GBP };
};

// Tipos de cambio y divisa activa (spec §5), solo en memoria. Es la única excepción a BaseHttpService:
// la API de divisas es externa y no sigue nuestro contrato. No convierte: eso es de shared/divisas.ts.
@Injectable({ providedIn: 'root' })
export class DivisasService {
  private readonly tipos = signal<Tipos | null>(null);
  private readonly elegida = signal<CodigoDivisa>('EUR');
  private readonly fallo = signal(false);

  // la divisa con la que se pinta; sin tipos, siempre euros
  readonly activa = computed<Divisa>(() => {
    const tipos = this.tipos();
    const codigo = this.elegida();
    return tipos ? { codigo, cambio: tipos[codigo] } : EUR;
  });
  readonly disponible = computed(() => this.tipos() !== null);
  readonly caida = this.fallo.asReadonly();
  // ni tipos ni fallo todavía
  readonly cargando = computed(() => !this.disponible() && !this.caida());

  // se piden al crearse el servicio, que es único: una sola vez aunque lo usen varios
  constructor() {
    inject(HttpClient)
      .get<RespuestaTipos>(URL_TIPOS)
      .pipe(timeout(ESPERA_MAXIMA_MS), map(leerTipos), takeUntilDestroyed())
      .subscribe({ next: (tipos) => this.tipos.set(tipos), error: () => this.fallo.set(true) });
  }

  elegir(codigo: CodigoDivisa): void {
    this.elegida.set(codigo);
  }
}
