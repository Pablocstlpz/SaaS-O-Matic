import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

// ÚNICA puerta para avisar al usuario. Los componentes no importan MatSnackBar:
//   aviso() -> snackbar breve: confirmaciones que no piden nada
//   error() -> snackbar que se queda más tiempo y se puede cerrar a mano
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly snackBar = inject(MatSnackBar);

  aviso(texto: string): void {
    this.snackBar.open(texto, undefined, { duration: 3000 });
  }

  // recibe el texto ya redactado (normalmente ErrorApi.message, que escribe el servidor)
  error(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 8000 });
  }
}
