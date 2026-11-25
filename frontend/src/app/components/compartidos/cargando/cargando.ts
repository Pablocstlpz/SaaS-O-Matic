import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Pieza compartida de presentacion: recibe datos por input() y no llama a servicios.
@Component({
  selector: 'app-cargando',
  imports: [MatProgressSpinnerModule],
  templateUrl: './cargando.html',
  styleUrl: './cargando.css',
  // en bloque: animate.leave le baja la opacidad al anfitrion, y en linea no se aplica bien a su div
  host: { class: 'block' },
})
export class Cargando {
  readonly texto = input('Cargando…');
}
