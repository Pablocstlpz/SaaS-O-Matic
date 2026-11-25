import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '../interfaces/id';
import { DatosProducto, Producto } from '../interfaces/producto';
import { BaseHttpService } from './base-http.service';

// EJEMPLO de servicio de recurso: un metodo por endpoint, tipado, sin estado ni logica de pantalla.
@Injectable({ providedIn: 'root' })
export class ProductosService extends BaseHttpService {
  listar(): Observable<Producto[]> {
    return this.get<Producto[]>('/productos');
  }

  obtener(id: Id): Observable<Producto> {
    return this.get<Producto>(`/productos/${id}`);
  }

  crear(datos: DatosProducto): Observable<Producto> {
    return this.post<Producto>('/productos', datos);
  }

  actualizar(id: Id, datos: Partial<DatosProducto>): Observable<Producto> {
    return this.put<Producto>(`/productos/${id}`, datos);
  }

  eliminar(id: Id): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/productos/${id}`);
  }
}
