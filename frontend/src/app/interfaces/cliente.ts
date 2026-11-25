// Contrato con la API: los MISMOS nombres de campo que devuelve el backend, uno a uno.
// Si el backend cambia un campo, esta interfaz cambia en el mismo commit.
import { PAISES, PLANES } from '../shared/regex';
import { Id } from './id';

export type Plan = (typeof PLANES)[number];
export type CodigoPais = (typeof PAISES)[number]['codigo'];

// lo que DEVUELVE la API
export interface Cliente {
  id: Id;
  nombre_empresa: string;
  identificador_fiscal: string;
  email_contacto: string;
  pais: CodigoPais;
  plan: Plan;
  fecha_creacion: string;
}

// lo que se ENVÍA al dar de alta: sin id ni fecha, que pone el servidor
export type DatosCliente = Pick<
  Cliente,
  'nombre_empresa' | 'identificador_fiscal' | 'email_contacto' | 'pais' | 'plan'
>;
