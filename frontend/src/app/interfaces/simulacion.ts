// Contrato con la API: los MISMOS nombres de campo que devuelve el backend, uno a uno.
// Todo importe termina en _centimos y es un entero de céntimos de euro.
import { CodigoPais } from './cliente';
import { Id } from './id';

// Una línea del desglose. `hasta` es null en el último tramo.
export interface LineaTramo {
  desde: number;
  hasta: number | null;
  usuarios: number;
  precio_unitario_centimos: number;
  subtotal_centimos: number;
}

// respuesta de POST /simulations/calcular: la vista previa, que no se guarda
export interface Calculo {
  usuarios: number;
  pais: CodigoPais;
  tramos: LineaTramo[];
  coste_base_centimos: number;
  porcentaje_impuesto: number;
  impuesto_centimos: number;
  total_centimos: number;
}

export type DatosCalculo = Pick<Calculo, 'usuarios' | 'pais'>;

// una simulación guardada: sin desglose por tramos
export interface Simulacion {
  id: Id;
  cliente_id: Id;
  usuarios: number;
  almacenamiento_gb: number;
  llamadas_api: number;
  coste_base_centimos: number;
  porcentaje_impuesto: number;
  impuesto_centimos: number;
  total_centimos: number;
  fecha_creacion: string;
}

// lo que se ENVÍA al guardar: los importes y el impuesto los pone el servidor
export type DatosSimulacion = Pick<Simulacion, 'cliente_id' | 'usuarios' | 'almacenamiento_gb' | 'llamadas_api'>;
