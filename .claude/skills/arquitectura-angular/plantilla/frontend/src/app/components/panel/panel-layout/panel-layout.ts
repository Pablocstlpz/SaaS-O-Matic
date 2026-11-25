import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslatePipe } from '@ngx-translate/core';

import { IdiomaService } from '../../../services/idioma.service';
import { PaginadorTraducido } from '../../../services/paginador-traducido.service';
import { SesionService } from '../../../services/sesion.service';

// Layout de una zona de la app: cabecera y menu comunes, y <router-outlet> para sus pantallas hijas.
// Cada zona (publica, panel de admin, panel de operario...) tiene el suyo.
@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './panel-layout.html',
  styleUrl: './panel-layout.css',
  // textos del paginador para TODAS las tablas del panel (las pantallas hijas lo heredan).
  // Aqui y no en app.config.ts: alli metia el paginador de Material entero en la carga inicial
  // (de 323 kB a 641 kB); el panel se carga en diferido y solo lo descarga quien entra.
  providers: [{ provide: MatPaginatorIntl, useClass: PaginadorTraducido }],
})
export class PanelLayout {
  protected readonly sesion = inject(SesionService);
  protected readonly idioma = inject(IdiomaService);
  private readonly router = inject(Router);

  protected alternarIdioma(): void {
    void this.idioma.cambiar(this.idioma.actual() === 'es' ? 'en' : 'es');
  }

  protected salir(): void {
    this.sesion.cerrar();
    void this.router.navigate(['/login']);
  }
}
