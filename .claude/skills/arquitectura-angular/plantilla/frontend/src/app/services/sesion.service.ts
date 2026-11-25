import { Injectable, computed, signal } from '@angular/core';
import { Observable, map, tap, throwError } from 'rxjs';

import { RespuestaLogin, Tokens, Usuario } from '../interfaces/usuario';
import { BaseHttpService, ErrorApi } from './base-http.service';

interface SesionGuardada extends Tokens {
  usuario: Usuario;
}

const CLAVE = 'sesion';

// Estado de la sesion compartido por toda la app: una signal privada y lecturas publicas.
// Es el patron para cualquier estado que necesiten varias pantallas.
//
// sessionStorage: la sesion muere al cerrar la pestana. Cualquier XSS puede leerla;
// el paso siguiente, cuando haga falta, es el refresco en cookie httpOnly.
@Injectable({ providedIn: 'root' })
export class SesionService extends BaseHttpService {
  // en SSR o en tests sin navegador no hay sessionStorage: la sesion vive solo en memoria
  private readonly almacen = typeof sessionStorage === 'undefined' ? null : sessionStorage;
  private readonly sesion = signal<SesionGuardada | null>(this.leer());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly iniciada = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'admin');

  token(): string | null {
    return this.sesion()?.accessToken ?? null;
  }

  iniciar(email: string, password: string): Observable<Usuario> {
    return this.post<RespuestaLogin>('/auth/login', { email, password }).pipe(
      tap(({ usuario, accessToken, refreshToken }) => this.guardar({ usuario, accessToken, refreshToken })),
      map(({ usuario }) => usuario),
    );
  }

  // la llama el interceptor al recibir un 401; conserva el usuario y cambia los tokens
  renovar(): Observable<Tokens> {
    const actual = this.sesion();
    if (!actual) return throwError(() => new ErrorApi(401, 'No hay sesion'));
    return this.post<Tokens>('/auth/renovar', { refreshToken: actual.refreshToken }).pipe(
      tap((tokens) => this.guardar({ ...actual, ...tokens })),
    );
  }

  cerrar(): void {
    this.sesion.set(null);
    this.almacen?.removeItem(CLAVE);
  }

  private guardar(sesion: SesionGuardada): void {
    this.sesion.set(sesion);
    this.almacen?.setItem(CLAVE, JSON.stringify(sesion));
  }

  private leer(): SesionGuardada | null {
    try {
      const texto = this.almacen?.getItem(CLAVE);
      return texto ? (JSON.parse(texto) as SesionGuardada) : null;
    } catch {
      // JSON corrupto: mejor sin sesion que una app que revienta al arrancar
      return null;
    }
  }
}
