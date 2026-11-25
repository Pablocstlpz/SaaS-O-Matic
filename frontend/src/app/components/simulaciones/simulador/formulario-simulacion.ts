// El formulario del simulador: sus campos, sus límites y dónde se pinta cada error.
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';

import { ErrorCampo } from '../../../services/base-http.service';
import { LIMITES } from '../../../shared/regex';

interface ReglaEntero {
  obligatorio: string;
  // el «debe ser» sin los límites, que se añaden detrás
  debeSer: string;
  min: number;
  max: number;
}

const enTexto = (numero: number) => numero.toLocaleString('es-ES');

// Los mismos textos que la API. El error de un campo es siempre { mensaje }, venga de aquí o del servidor.
const enteroEntre =
  ({ obligatorio, debeSer, min, max }: ReglaEntero): ValidatorFn =>
  ({ value }: AbstractControl<number | null>) => {
    if (value === null) return { mensaje: obligatorio };
    const vale = Number.isInteger(value) && value >= min && value <= max;
    return vale ? null : { mensaje: `${debeSer} entre ${enTexto(min)} y ${enTexto(max)}` };
  };

// nulos: un campo numérico vacío no tiene número
const campoEntero = (inicial: number, regla: ReglaEntero) =>
  new FormControl<number | null>(inicial, enteroEntre(regla));

export const crearFormulario = () =>
  new FormGroup({
    usuarios: campoEntero(LIMITES.USUARIOS_MIN, {
      obligatorio: 'Los usuarios son obligatorios',
      debeSer: 'Los usuarios deben ser un número entero',
      min: LIMITES.USUARIOS_MIN,
      max: LIMITES.USUARIOS_MAX,
    }),
    almacenamiento_gb: campoEntero(LIMITES.ALMACENAMIENTO_GB_MIN, {
      obligatorio: 'El almacenamiento es obligatorio',
      debeSer: 'El almacenamiento debe ser un número entero de GB',
      min: LIMITES.ALMACENAMIENTO_GB_MIN,
      max: LIMITES.ALMACENAMIENTO_GB_MAX,
    }),
    llamadas_api: campoEntero(LIMITES.LLAMADAS_API_MIN, {
      obligatorio: 'Las llamadas a la API son obligatorias',
      debeSer: 'Las llamadas a la API deben ser un número entero',
      min: LIMITES.LLAMADAS_API_MIN,
      max: LIMITES.LLAMADAS_API_MAX,
    }),
  });

// Pone cada error del servidor junto a su campo. Devuelve false si alguno se queda sin sitio
// (o no trae ninguno): entonces hay que pintar el mensaje general.
export const pintarErrores = (formulario: FormGroup, errores: readonly ErrorCampo[]): boolean => {
  const sinSitio = errores.filter(({ campo, mensaje }) => {
    const control = formulario.get(campo);
    control?.setErrors({ mensaje });
    return !control;
  });
  return errores.length > 0 && sinSitio.length === 0;
};
