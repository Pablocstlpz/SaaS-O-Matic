import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

// EJEMPLO de pieza compartida: solo presentacion, recibe datos por input() y no llama a servicios.
@Component({
  selector: 'app-cargando',
  imports: [MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './cargando.html',
  styleUrl: './cargando.css',
})
export class Cargando {
  // clave de traduccion del texto; por defecto «Cargando…»
  readonly texto = input('comun.cargando');
}
