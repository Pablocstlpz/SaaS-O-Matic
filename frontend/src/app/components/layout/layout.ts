import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { DivisasService } from '../../services/divisas.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { SelectorDivisa } from '../compartidos/selector-divisa/selector-divisa';

const AVISO_SIN_TIPOS = 'No se pueden cargar los tipos de cambio. Los importes se muestran en euros';

// Cabecera comun, con el selector de divisa, <router-outlet> para las pantallas y pie.
// El aviso sale de aqui y no de DivisasService: en la skill un servicio no usa otros servicios.
@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterOutlet, SelectorDivisa],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  // columna a pantalla completa: el pie queda abajo aunque la pantalla tenga poco contenido
  host: { class: 'flex min-h-dvh flex-col' },
})
export class Layout {
  protected readonly divisas = inject(DivisasService);

  constructor() {
    const notificaciones = inject(NotificacionesService);
    effect(() => {
      // untracked: abrir el aviso no tiene que sumar dependencias al effect
      if (this.divisas.caida()) untracked(() => notificaciones.error(AVISO_SIN_TIPOS));
    });
  }
}
