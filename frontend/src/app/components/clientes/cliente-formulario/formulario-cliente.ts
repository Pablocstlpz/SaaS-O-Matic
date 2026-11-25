// El formulario de alta: sus campos, sus límites y los mismos textos que la API.
// El error de un campo es siempre { mensaje }, venga de aquí o del servidor.
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';

import { CodigoPais, Plan } from '../../../interfaces/cliente';
import { LIMITES } from '../../../shared/regex';

const {
  NOMBRE_EMPRESA_MIN,
  NOMBRE_EMPRESA_MAX,
  EMAIL_MAX,
  IDENTIFICADOR_EXTRANJERO_MIN,
  IDENTIFICADOR_EXTRANJERO_MAX,
} = LIMITES;

// Solo formato y longitud (spec §6): la letra de control la comprueba el servidor.
// En España, 8 números y una letra (DNI), o una letra, 7 números y el control (NIE y CIF).
const FORMATO_ESPANA = /^(\d{8}[A-Z]|[A-Z]\d{7}[A-Z0-9])$/;
const FORMATO_EXTRANJERO = new RegExp(`^[A-Z0-9]{${IDENTIFICADOR_EXTRANJERO_MIN},${IDENTIFICADOR_EXTRANJERO_MAX}}$`);
// ponytail: más permisivo que el isEmail del servidor; lo que se escape vuelve como 400 junto al campo
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Las mismas limpiezas que hace la API antes de validar. Se envía lo escrito: la API lo limpia.
const limpiarNombre = (texto: string) => texto.trim().replace(/\s+/g, ' ');
const normalizarIdentificador = (texto: string) => texto.toUpperCase().replace(/[\s.-]/g, '');

interface ReglaTexto {
  obligatorio: string;
  debeSer: string;
  limpiar: (texto: string) => string;
  vale: (limpio: string) => boolean;
}

const texto =
  ({ obligatorio, debeSer, limpiar, vale }: ReglaTexto): ValidatorFn =>
  ({ value }: AbstractControl<string>) => {
    const limpio = limpiar(value);
    if (limpio === '') return { mensaje: obligatorio };
    return vale(limpio) ? null : { mensaje: debeSer };
  };

const elegido =
  (obligatorio: string): ValidatorFn =>
  ({ value }: AbstractControl<string | null>) =>
    value === null ? { mensaje: obligatorio } : null;

const campoTexto = (regla: ReglaTexto) => new FormControl('', { nonNullable: true, validators: texto(regla) });

export const crearFormulario = () => {
  const pais = new FormControl<CodigoPais | null>(null, elegido('El país es obligatorio'));
  return new FormGroup({
    nombre_empresa: campoTexto({
      obligatorio: 'El nombre de empresa es obligatorio',
      debeSer: `El nombre de empresa debe ser un texto de ${NOMBRE_EMPRESA_MIN} a ${NOMBRE_EMPRESA_MAX} caracteres`,
      limpiar: limpiarNombre,
      // por caracteres, como la API: un emoji cuenta uno, no dos
      vale: (nombre) => {
        const { length } = [...nombre];
        return length >= NOMBRE_EMPRESA_MIN && length <= NOMBRE_EMPRESA_MAX;
      },
    }),
    email_contacto: campoTexto({
      obligatorio: 'El email de contacto es obligatorio',
      debeSer: `El email de contacto debe ser una dirección válida de ${EMAIL_MAX} caracteres como máximo`,
      limpiar: (email) => email.trim(),
      vale: (email) => FORMATO_EMAIL.test(email) && email.length <= EMAIL_MAX,
    }),
    pais,
    // la regla depende del país; sin país elegido, el aviso sale solo en el país (como en la API)
    identificador_fiscal: campoTexto({
      obligatorio: 'El identificador fiscal es obligatorio',
      debeSer: 'El identificador fiscal debe ser válido para el país elegido',
      limpiar: normalizarIdentificador,
      vale: (id) => pais.value === null || (pais.value === 'ES' ? FORMATO_ESPANA : FORMATO_EXTRANJERO).test(id),
    }),
    plan: new FormControl<Plan | null>(null, elegido('El plan es obligatorio')),
  });
};
