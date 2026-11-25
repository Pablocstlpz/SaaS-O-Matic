// EJEMPLO de entidad. Copia este fichero para cada recurso nuevo.
import { ESTADOS_PRODUCTO } from '../shared/regex';
import { Id } from './id';

export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[number];

// lo que DEVUELVE la API
export interface Producto {
  id: Id;
  organizacion_id: Id;
  nombre: string;
  precio: number;
  estado: EstadoProducto;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

// lo que se ENVIA al crear o actualizar: sin id, organizacion ni fechas, que pone el servidor
export type DatosProducto = Pick<Producto, 'nombre' | 'precio' | 'estado'>;
