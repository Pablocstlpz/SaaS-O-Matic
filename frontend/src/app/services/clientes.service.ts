import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente, DatosCliente } from '../interfaces/cliente';
import { Id } from '../interfaces/id';
import { Simulacion } from '../interfaces/simulacion';
import { BaseHttpService } from './base-http.service';

// Un método por endpoint de /customers, tipado, sin estado ni lógica de pantalla.
@Injectable({ providedIn: 'root' })
export class ClientesService extends BaseHttpService {
  // sin texto no se envía q: la API devuelve los primeros por nombre
  listar(q = ''): Observable<Cliente[]> {
    const consulta = q ? `?q=${encodeURIComponent(q)}` : '';
    return this.get<Cliente[]>(`/customers${consulta}`);
  }

  obtener(id: Id): Observable<Cliente> {
    return this.get<Cliente>(`/customers/${id}`);
  }

  // el historial del cliente, la simulación más nueva primero
  listarSimulaciones(id: Id): Observable<Simulacion[]> {
    return this.get<Simulacion[]>(`/customers/${id}/simulations`);
  }

  crear(datos: DatosCliente): Observable<Cliente> {
    return this.post<Cliente>('/customers', datos);
  }
}
