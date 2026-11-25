import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

// UNICA puerta para avisar al usuario. Los componentes no importan MatSnackBar ni Swal:
//   aviso()     -> snackbar de Material: confirmaciones que no piden nada ("Cambios guardados")
//   error()     -> snackbar que se queda mas tiempo y se cierra a mano
//   confirmar() -> SweetAlert2: preguntas que bloquean ("¿Eliminar?")
// Asi cambiar de libreria de avisos es tocar este fichero, no treinta pantallas.
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  // recibe CLAVES de traduccion, no textos
  aviso(clave: string, parametros?: Record<string, unknown>): void {
    this.snackBar.open(this.translate.instant(clave, parametros), undefined, { duration: 3000 });
  }

  // recibe el texto ya redactado (normalmente ErrorApi.message, que escribe el servidor)
  error(mensaje: string): void {
    this.snackBar.open(mensaje, this.translate.instant('comun.cerrar'), { duration: 8000 });
  }

  async confirmar(opciones: {
    titulo: string;
    texto?: string;
    confirmar: string;
    parametros?: Record<string, unknown>;
    peligroso?: boolean;
  }): Promise<boolean> {
    const t = (clave: string) => this.translate.instant(clave, opciones.parametros);
    const { isConfirmed } = await Swal.fire({
      title: t(opciones.titulo),
      text: opciones.texto ? t(opciones.texto) : undefined,
      icon: opciones.peligroso ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: t(opciones.confirmar),
      cancelButtonText: t('comun.cancelar'),
      // rojo solo en acciones destructivas; el foco en Cancelar para que un Enter no borre nada
      confirmButtonColor: opciones.peligroso ? '#dc2626' : undefined,
      focusCancel: opciones.peligroso,
      reverseButtons: true,
      theme: 'auto',
    });
    return isConfirmed;
  }
}
